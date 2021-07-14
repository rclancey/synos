package api

import (
	//"fmt"
	"log"
	"net/http"

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

func APIMain() {
	var err error
	cfg, err = Configure()
	if err != nil {
		log.Fatal("error configuring server:", err)
	}
	srv, err := httpserver.NewServer(cfg.ServerConfig)
	if err != nil {
		log.Fatal(err)
	}
	cfg.Finder.FileFinder()
	db, err = cfg.Database.DB()
	if err != nil {
		log.Fatal("error connecting to music database:", err)
	}
	smtp, err = cfg.SMTP.Client()
	if err != nil {
		log.Fatal("error configuring smtp client:", err)
	}

	errlog, err := cfg.Logging.ErrorLogger()
	if err != nil {
		log.Fatal("error sending default log messages to error log:", err)
	}
	errlog.Colorize()
	errlog.SetLevelColor(logging.INFO, logging.ColorCyan, logging.ColorDefault, logging.FontDefault)
	errlog.SetLevelColor(logging.LOG, logging.ColorMagenta, logging.ColorDefault, logging.FontDefault)
	errlog.SetLevelColor(logging.NONE, logging.ColorHotPink, logging.ColorDefault, logging.FontDefault)
	errlog.SetTimeFormat("2006-01-02 15:04:05.000")
	errlog.SetTimeColor(logging.ColorDefault, logging.ColorDefault, logging.FontItalic | logging.FontLight)
	errlog.SetSourceFormat("%{basepath}:%{linenumber}:")
	errlog.SetSourceColor(logging.ColorGreen, logging.ColorDefault, logging.FontDefault)
	errlog.SetPrefixColor(logging.ColorOrange, logging.ColorDefault, logging.FontDefault)
	errlog.SetMessageColor(logging.ColorDefault, logging.ColorDefault, logging.FontDefault)
	errlog.MakeDefault()
	errlog.Infoln("Synos server starting...")
	go func() {
		getSonos(false)
	}()

	go func() {
		cron, err := cfg.Jooki.LoadCron()
		if err != nil {
			log.Println("error loading cron config:", err)
		} else {
			ScheduleFromConfig(cron)
		}
		getJooki(false)
	}()

	lastFm = cfg.LastFM.Client()
	spot = cfg.Spotify.Client()

	_, err = WatchITunes()
	if err != nil {
		errlog.Error(err)
	}

	authen, err := auth.NewAuthenticator(cfg.Auth, cfg.ServerRoot)
	if err != nil {
		errlog.Fatalln("error configuring authenticator:", err)
	}
	authen.UserSource = db
	authen.EmailClient = smtp
	authen.SMSClient = nil // TODO
	authmw := authen.MakeMiddleware()
	api := srv.Prefix("/api")
	authen.LoginAPI(api)
	TrackAPI(api, authmw)
	PlaylistAPI(api, authmw)
	IndexAPI(api, authmw)
	ArtAPI(api, authmw)
	CronAPI(api, authmw)
	RadioAPI(api, authmw)
	WebSocketAPI(api, authmw)
	SonosAPI(api.Prefix("/sonos"), authmw)
	JookiAPI(api.Prefix("/jooki"), authmw)
	/*
	if cfg.Sonos != SonosConfig{} {
		SonosAPI(api.Prefix("/sonos"), authmw)
	}
	if cfg.Jooki != JookiConfig{} {
		JookiAPI(api.Prefix("/jooki"), authmw)
	}
	*/
	DebugAPI(api, authmw)
	errlog.Infoln("Synos server ready")
	srv.ListenAndServe()
	errlog.Infoln("Synos server exiting")
}
