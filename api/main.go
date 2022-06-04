package api

import (
	//"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/pkg/errors"
	"github.com/rclancey/azlyrics"
	"github.com/rclancey/httpserver/v2"
	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/logging"
	"github.com/rclancey/lastfm"
	"github.com/rclancey/sendmail"
	"github.com/rclancey/synos/musicdb"
	"github.com/rclancey/spotify"
)

type hf func(http.ResponseWriter, *http.Request) (interface{}, error)

var db *musicdb.DB
var smtp *sendmail.SMTPClient
var cfg *SynosConfig
var lastFm *lastfm.LastFM
var spot *spotify.SpotifyClient
var azClient *azlyrics.LyricsClient

func APIMain() {
	var errlog *logging.Logger
	var srv *httpserver.Server
	var err error
	shutdown := false
	for !shutdown {
		sigch := make(chan os.Signal, 10)
		go func() {
			sig, ok := <-sigch
			if !ok || sig == nil {
				log.Println("no signal!")
				return
			}
			log.Println("handling signal", sig)
			switch sig {
			case syscall.SIGINT:
				log.Println("got SIGINT")
				shutdown = true
				if srv != nil {
					if errlog != nil {
						errlog.Infoln("SIGINT")
					}
					srv.Shutdown()
				}
			case syscall.SIGHUP:
				log.Println("got SIGHUP")
				if srv != nil {
					if errlog != nil {
						errlog.Infoln("SIGHUP")
					}
					srv.Shutdown()
				}
			}
		}()
		signal.Notify(sigch, syscall.SIGINT, syscall.SIGHUP)
		errlog, srv, err = startup()
		if err != nil {
			break
		}
		srv.ListenAndServe()
		errlog.Infoln("Synos server shut down")
		close(sigch)
	}
	errlog.Infoln("Synos server exiting")
}

/*
admin api
if !config {
	configure stderr logging
	return
}
configure logging
if !database {
	if !create database {
		return
	}
}
configure database
if !migrations table {
	return
}
if migrations {
	if !apply migrations {
		return
	}
}

configure smtp
configure finder
configure spotify
configure lastfm
configure itunes
monitor itunes

track api
playlist api
genius api
recents api
index api
art api
cron api
radio api
websocket api
if sonos {
	sonos api
}
if jooki {
	jooki api
}
if debug {
	debug api
}

*/

func colorizeLogger(l *logging.Logger) {
	l.Colorize()
	l.SetLevelColor(logging.INFO, logging.ColorCyan, logging.ColorDefault, logging.FontDefault)
	l.SetLevelColor(logging.LOG, logging.ColorMagenta, logging.ColorDefault, logging.FontDefault)
	l.SetLevelColor(logging.NONE, logging.ColorHotPink, logging.ColorDefault, logging.FontDefault)
	l.SetTimeFormat("2006-01-02 15:04:05.000")
	l.SetTimeColor(logging.ColorDefault, logging.ColorDefault, logging.FontItalic | logging.FontLight)
	l.SetSourceFormat("%{basepath}:%{linenumber}:")
	l.SetSourceColor(logging.ColorGreen, logging.ColorDefault, logging.FontDefault)
	l.SetPrefixColor(logging.ColorOrange, logging.ColorDefault, logging.FontDefault)
	l.SetMessageColor(logging.ColorDefault, logging.ColorDefault, logging.FontDefault)
	l.MakeDefault()
}

func safeMode(cfg *SynosConfig, cause error) (*logging.Logger, *httpserver.Server, error) {
	if cfg == nil {
		cfg = &SynosConfig{
			ServerConfig: httpserver.DefaultServerConfig(),
		}
	}
	errlog, err := cfg.Logging.ErrorLogger()
	if err == nil {
		colorizeLogger(errlog)
	} else {
		errlog = logging.NewLogger(os.Stderr, logging.DEBUG)
		colorizeLogger(errlog)
		errlog.Errorf("error logging to %s: %s; sending errors to STDERR", cfg.Logging.ErrorLog, err)
	}
	srv, err := httpserver.NewServer(cfg.ServerConfig)
	if err != nil {
		log.Fatal(err)
	}
	SetupAPI(srv, cause)
	errlog.Infoln("Synos server running in safe mode")
	return errlog, srv, nil
}

func prepareDB(cfg *SynosConfig) error {
	installer, err := NewSynosInstaller(cfg)
	if err != nil {
		log.Println("error setting up installer:", err)
		return err
	}
	defer installer.Close()
	err = installer.Connect()
	if err != nil {
		log.Println("error connecting to database:", err)
		return err
	}
	err = installer.UpdateDB()
	if err != nil {
		log.Println("error applying database migrations:", err)
		return err
	}
	return nil
}

func startup() (*logging.Logger, *httpserver.Server, error) {
	var err error
	cfg, err = Configure()
	if err != nil {
		log.Println("error configuring server:", err)
		return safeMode(nil, errors.Wrap(err, ErrInvalidConfiguration.Error()))
	}
	if cfg == nil {
		log.Println("no configuration found")
		return safeMode(nil, ErrNoConfiguration)
	}
	errlog, err := cfg.Logging.ErrorLogger()
	if err != nil {
		log.Println("error configuring logging:", err)
		return safeMode(cfg, errors.Wrap(err, ErrLoggingError.Error()))
	}
	colorizeLogger(errlog)

	err = prepareDB(cfg)
	if err != nil {
		log.Println("error preparing database:", err)
		return safeMode(cfg, errors.Wrap(err, ErrInstallerError.Error()))
	}

	db, err = cfg.Database.DB()
	if err != nil {
		log.Println("error connecting to music database:", err)
		return safeMode(cfg, errors.Wrap(err, ErrDatabaseError.Error()))
	}

	smtp, err = cfg.SMTP.Client()
	if err != nil {
		log.Println("error configuring smtp client:", err)
		return safeMode(cfg, errors.Wrap(err, ErrSMTPClientError.Error()))
	}

	authen, err := auth.NewAuthenticator(cfg.Auth, db)
	if err != nil {
		errlog.Println("error configuring authenticator:", err)
		return safeMode(cfg, errors.Wrap(err, ErrAuthenticatorError.Error()))
	}
	authen.UserSource = db
	authen.EmailClient = smtp
	authen.SMSClient = nil // TODO
	authmw := authen.MakeMiddleware()

	cfg.Finder.FileFinder()
	lastFm = cfg.LastFM.Client()
	spot = cfg.Spotify.Client()
	azClient = cfg.Lyrics.Client()
	watch, err := WatchITunes()
	if err != nil {
		errlog.Errorln("error watching itunes libraries:", err)
	}

	srv, err := httpserver.NewServer(cfg.ServerConfig)
	if err != nil {
		log.Fatalln("can't create server:", err)
	}

	srv.RegisterOnShutdown(func() {
		log.Println("cleanup globals on shutdown")
		smtp = nil
		lastFm = nil
		spot = nil
		watch <- true
		sonosDevice = nil
		jookiDevice = nil
	})

	errlog.Infoln("Synos server starting...")
	go func() {
		dev, err := getSonos(false)
		if err != nil {
			errlog.Errorln("error getting sonos device:", err)
		} else if dev == nil {
			errlog.Warnln("sonos not available")
		} else {
			errlog.Infoln("sonos ready")
		}
	}()

	go func() {
		log.Println("loading jooki cron")
		cron, err := cfg.Jooki.LoadCron()
		if err != nil {
			log.Println("error loading cron config:", err)
		} else {
			ScheduleFromConfig(cron)
		}
		log.Println("loading jooki device")
		dev, err := getJooki(false)
		if err != nil {
			errlog.Errorln("error getting jooki device:", err)
		} else if dev == nil {
			errlog.Warnln("jooki not available")
		} else {
			errlog.Infoln("jooki ready")
		}
	}()

	api := srv.Prefix("/api")
	authen.LoginAPI(api)
	SetupAPI(srv, nil)
	VersionAPI(api, authmw)
	TrackAPI(api, authmw)
	PlaylistAPI(api, authmw)
	GeniusAPI(api.Prefix("/genius"), authmw)
	RecentsAPI(api, authmw)
	IndexAPI(api, authmw)
	ArtAPI(api, authmw)
	CronAPI(api, authmw)
	RadioAPI(api, authmw)
	AdminAPI(api.Prefix("/admin"), authmw)
	WebSocketAPI(api, authmw)
	srv.RegisterWebSocketHub(websocketHub)
	/*
	if cfg.Sonos != SonosConfig{} {
		SonosAPI(api.Prefix("/sonos"), authmw)
	}
	*/
	SonosAPI(api.Prefix("/sonos"), authmw)
	/*
	if cfg.Jooki != JookiConfig{} {
		JookiAPI(api.Prefix("/jooki"), authmw)
	}
	*/
	JookiAPI(api.Prefix("/jooki"), authmw)
	if cfg.Logging.LogLevel == logging.DEBUG {
		DebugAPI(api, authmw)
	}
	errlog.Infoln("Synos server ready")
	return errlog, srv, nil
}
