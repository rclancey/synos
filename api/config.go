package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/rclancey/argparse"
	"github.com/rclancey/httpserver/v2"
	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/itunes/loader"
	"github.com/rclancey/lastfm"
	"github.com/rclancey/sendmail"
	"github.com/rclancey/spotify"
	"github.com/rclancey/synos/musicdb"
)

type DatabaseConfig struct {
	Name     string `json:"name"`//     arg:"--db-name"`
	Host     string `json:"host"`//     arg:"--db-host"`
	Port     int    `json:"port"`//     arg:"--db-port"`
	Socket   string `json:"socket"`//   arg:"--db-socket"`
	Username string `json:"username"`// arg:"--db-username"`
	Password string `json:"password"`// arg:"--db-password"`
	Timeout  int    `json:"timeout"`//  arg:"--db-timeout"`
	SSL      bool   `json:"ssl"`//      arg:"--db-ssl"`
	db *musicdb.DB
}

func (cfg *DatabaseConfig) Clone() *DatabaseConfig {
	clone := *cfg
	clone.db = nil
	return &clone
}

func (cfg *DatabaseConfig) DSN() string {
	safe := func(k string, v interface{}) string {
		switch xv := v.(type) {
		case string:
			return fmt.Sprintf("%s='%s'", k, strings.Replace(xv, "'", `\'`, -1))
		case int:
			return fmt.Sprintf("%s=%d", k, xv)
		}
		return fmt.Sprintf("%s='%v'", k, v)
	}
	parts := []string{
		safe("dbname", cfg.Name),
	}
	if cfg.Socket != "" {
		parts = append(parts, safe("host", cfg.Socket))
	} else if cfg.Host != "" {
		parts = append(parts, safe("host", cfg.Host))
	}
	if cfg.Port != 0 {
		parts = append(parts, safe("port", cfg.Port))
	}
	if cfg.Username != "" {
		parts = append(parts, safe("user", cfg.Username))
	}
	if cfg.Password != "" {
		parts = append(parts, safe("password", cfg.Password))
	}
	if cfg.Timeout > 0 {
		parts = append(parts, safe("connect_timeout", cfg.Timeout))
	}
	if cfg.SSL {
		parts = append(parts, safe("sslmode", "require"))
	} else {
		parts = append(parts, safe("sslmode", "disable"))
	}
	return strings.Join(parts, " ")
}

func (cfg *DatabaseConfig) DB() (*musicdb.DB, error) {
	if cfg.db == nil {
		db, err := musicdb.Open(cfg.DSN())
		if err != nil {
			return nil, err
		}
		cfg.db = db
	}
	return cfg.db, nil
}

type SMTPConfig struct {
	Username *string `json:"username" arg:"username"`
	Password *string `json:"password" arg:"password"`
	Host     string  `json:"host"     arg:"host"`
	Port     int     `json:"port"     arg:"port"`
	client   *sendmail.SMTPClient
}

func (cfg *SMTPConfig) Client() (*sendmail.SMTPClient, error) {
	if cfg.client == nil {
		client := sendmail.NewSMTPClient(cfg.Host, cfg.Port)
		if cfg.Username != nil && cfg.Password != nil {
			client.SetAuth(*cfg.Username, *cfg.Password)
		}
		cfg.client = client
	}
	return cfg.client, nil
}

type FinderConfig struct {
	MediaPath   []string `json:"media_path"`//   arg:"--media-path"`
	MediaFolder []string `json:"media_folder"`// arg:"--media-folder"`
	CoverArt    []string `json:"cover_art"`//    arg:"--cover-art"`
	finder *musicdb.FileFinder
}

func (cfg *FinderConfig) Init(top *SynosConfig) error {
	path := []string{}
	for _, v := range cfg.MediaPath {
		dn, err := top.Abs(v)
		if err != nil {
			return err
		}
		//xdn := filepath.Join(dn, cfg.MediaFolder)
		//st, err := os.Stat(xdn)
		st, err := os.Stat(dn)
		if err != nil {
			if !os.IsNotExist(err) {
				return err
			}
		} else if st.IsDir() {
			path = append(path, dn)
		}
	}
	if len(path) == 0 {
		return errors.New("no media directories found")
	}
	log.Println("media path:", cfg.MediaPath, "=>", path)
	cfg.MediaPath = path
	return nil
}

func (cfg *FinderConfig) FileFinder() *musicdb.FileFinder {
	if cfg.finder == nil {
		cfg.finder = musicdb.NewFileFinder(cfg.MediaFolder, cfg.MediaPath, cfg.MediaPath)
		musicdb.SetGlobalFinder(cfg.finder)
	}
	return cfg.finder
}


type AirplayConfig struct {
	*httpserver.NetworkConfig
}

type SonosConfig struct {
	*httpserver.NetworkConfig
}

type SleepTime struct {
	Time     int    `json:"time"`
	Override *int64 `json:"override"`
}

type WakeTime struct {
	*SleepTime
	PlaylistID *string `json:"playlist_id"`
}

type DayJob struct {
	Wake  *WakeTime  `json:"wake"`
	Sleep *SleepTime `json:"sleep"`
}

type CronConfig []*DayJob

type JookiConfig struct {
	Cron string `json:"cron"`
}

func (cfg *JookiConfig) Init(top *SynosConfig) error {
	fn, err := top.Abs(cfg.Cron)
	if err != nil {
		return err
	}
	cfg.Cron = fn
	return nil
}

func (cfg *JookiConfig) LoadCron() (*CronConfig, error) {
	f, err := os.Open(cfg.Cron)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	data, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, err
	}
	obj := &CronConfig{}
	err = json.Unmarshal(data, obj)
	if err != nil {
		return nil, err
	}
	return obj, nil
}

func (cfg *JookiConfig) SaveCron(cron *CronConfig) error {
	data, err := json.MarshalIndent(cron, "", "  ")
	if err != nil {
		return err
	}
	f, err := os.Create(cfg.Cron)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.Write(data)
	if err != nil {
		return err
	}
	return nil
}

type ITunesConfig struct {
	Library []string `json:"library"`// arg:"--itunes-library"`
	loader *loader.Loader
}

func (cfg *ITunesConfig) Init(top *SynosConfig) error {
	return nil
}

type LastFMConfig struct {
	APIKey         string `json:"api_key"`//    arg:"--lastfm-api-key"`
	CacheDirectory string `json:"cache"`//      arg:"--lastfm-cache"`
	CacheTime      int    `json:"cache_time"`// arg:"--lastfm-cache-time"`
	client *lastfm.LastFM
}

func (cfg *LastFMConfig) Init(top *SynosConfig) error {
	dn, err := top.Abs(cfg.CacheDirectory)
	if err != nil {
		return err
	}
	err = top.WritableDir(dn)
	if err != nil {
		return err
	}
	cfg.CacheDirectory = dn
	return nil
}

func (cfg *LastFMConfig) Client() *lastfm.LastFM {
	if cfg.client == nil {
		if cfg.APIKey == "" {
			return nil
		}
		cfg.client = lastfm.NewLastFM(cfg.APIKey, cfg.CacheDirectory, time.Duration(cfg.CacheTime) * time.Second)
	}
	return cfg.client
}

type SpotifyConfig struct {
	ClientID       string `json:"client_id"`//     arg:"--spotify-client-id"`
	ClientSecret   string `json:"client_secret"`// arg:"--spotify-client-secret"`
	CacheDirectory string `json:"cache"`//         arg:"--spotify-cache"`
	CacheTime      int    `json:"cache_time"`//    arg:"--spotify-cache-time"`
	client *spotify.SpotifyClient
}

func (cfg *SpotifyConfig) Init(top *SynosConfig) error {
	dn, err := top.Abs(cfg.CacheDirectory)
	if err != nil {
		return err
	}
	err = top.WritableDir(dn)
	if err != nil {
		return err
	}
	cfg.CacheDirectory = dn
	return nil
}

func (cfg *SpotifyConfig) Client() *spotify.SpotifyClient {
	if cfg.client == nil {
		if cfg.ClientID == "" || cfg.ClientSecret == "" {
			return nil
		}
		client, err := spotify.NewSpotifyClient(cfg.ClientID, cfg.ClientSecret, cfg.CacheDirectory, time.Duration(cfg.CacheTime) * time.Second)
		if err != nil {
			return nil
		}
		cfg.client = client
	}
	return cfg.client
}

type SynosConfig struct {
	*httpserver.ServerConfig
	Auth     auth.AuthConfig `json:"auth"     arg="auth"`
	Database DatabaseConfig  `json:"database" arg:"db"`
	SMTP     SMTPConfig      `json:"smtp"     arg:"smtp"`
	Finder   FinderConfig    `json:"finder"   arg:"finder"`
	Airplay  AirplayConfig   `json:"airplay"  arg:"airplay"`
	Sonos    SonosConfig `    json:"sonos"    arg:"sonos"`
	Jooki    JookiConfig     `json:"jooki"    arg:"jooki"`
	ITunes   ITunesConfig    `json:"itunes"   arg:"itunes"`
	LastFM   LastFMConfig    `json:"lastfm"   arg:"lastfm"`
	Spotify  SpotifyConfig   `json:"spotify"  arg:"spotify"`
}

func (cfg *SynosConfig) Init() error {
	err := cfg.ServerConfig.Init()
	if err != nil {
		return err
	}
	err = cfg.Auth.Init(cfg.ServerRoot)
	if err != nil {
		return err
	}
	err = cfg.Finder.Init(cfg)
	if err != nil {
		return err
	}
	err = cfg.Airplay.Init()
	if err != nil {
		return err
	}
	err = cfg.Sonos.Init()
	if err != nil {
		return err
	}
	err = cfg.Jooki.Init(cfg)
	if err != nil {
		return err
	}
	err = cfg.ITunes.Init(cfg)
	if err != nil {
		return err
	}
	err = cfg.LastFM.Init(cfg)
	if err != nil {
		return err
	}
	err = cfg.Spotify.Init(cfg)
	if err != nil {
		return err
	}
	return nil
}

func (cfg *SynosConfig) LoadFromFile(fn string) error {
	var f io.ReadCloser
	var err error
	if fn == "-" {
		f = os.Stdin
	} else {
		f, err = os.Open(fn)
		if err != nil {
			return err
		}
	}
	defer f.Close()
	data, err := ioutil.ReadAll(f)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, cfg)
}

func DefaultSynosConfig() *SynosConfig {
	return &SynosConfig{
		ServerConfig: httpserver.DefaultServerConfig(),
		Auth: auth.AuthConfig{
			AuthKey: "",
			TTL: int(time.Duration(30 * 24 * time.Hour).Seconds()),
			Issuer: "Synos",
			Cookie: "auth",
			Header: "Authorization",
			ResetTTL: int(time.Duration(30 * time.Minute).Seconds()),
			SocialLogin: map[string]*auth.SocialLoginConfig{},
		},
		Database: DatabaseConfig{
			Name: "synos",
			SSL: false,
		},
		Finder: FinderConfig{
			MediaFolder: []string{
				"Music/iTunes/iTunes Music",
				"Music/Music/Media.localized",
			},
			MediaPath: []string{},
			CoverArt: []string{
				"cover.jpg",
				"cover.png",
				"cover.gif",
			},
		},
		Airplay: AirplayConfig{},
		Sonos: SonosConfig{},
		Jooki: JookiConfig{},
		ITunes: ITunesConfig{
			Library: []string{
				"../../Music/Music Library.musiclibrary/Library.musicdb",
				"../../Music/Library.xml",
				"../iTunes Library.itl",
				"../iTunes Library",
				"../Library.xml",
				"../iTunes Music Library.xml",
			},
		},
		LastFM: LastFMConfig{
			CacheDirectory: "var/cache/lastfm",
			CacheTime: 30 * 24 * 60 * 60,
		},
		Spotify: SpotifyConfig{
			CacheDirectory: "var/cache/spotify",
			CacheTime: 30 * 24 * 60 * 60,
		},
	}
}

func Configure() (*SynosConfig, error) {
	var err error
	cfg := DefaultSynosConfig()
	err = argparse.ParseArgs(cfg)
	if err != nil {
		return nil, err
	}
	cfg.ServerRoot, err = filepath.Abs(filepath.Clean(httpserver.EnvEval(cfg.ServerRoot)))
	if err != nil {
		return nil, err
	}
	cfg.ConfigFile, err = cfg.Abs(cfg.ConfigFile)
	if err != nil {
		return nil, err
	}
	_, err = os.Stat(cfg.ConfigFile)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	} else {
		err = cfg.LoadFromFile(cfg.ConfigFile)
		if err != nil {
			return nil, err
		}
		err = argparse.ParseArgs(cfg)
		if err != nil {
			return nil, err
		}
	}
	err = cfg.Init()
	if err != nil {
		return nil, err
	}
	data, _ := json.MarshalIndent(cfg, "", "  ")
	log.Println(string(data))
	return cfg, nil
}
