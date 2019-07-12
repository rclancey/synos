package main

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"path/filepath"
	//"runtime"
	//"runtime/debug"
	"time"

	"lastfm"
	"musicdb"
	"sonos"
	"spotify"
)

var db *musicdb.DB
var dev *sonos.Sonos
var hub *Hub
var cfg *SynosConfig
var lastFm *lastfm.LastFM
var spot *spotify.SpotifyClient

func main() {
	var err error
	cfg, err = Configure()
	if err != nil {
		log.Fatal("error configuring server:", err)
	}
	musicdb.SetGlobalFinder(cfg.FileFinder())
	db, err = musicdb.Open(cfg.DSN)
	if err != nil {
		log.Fatal("error connecting to music database:", err)
	}

	go func() {
		s, err := sonos.NewSonos(cfg.NetworkInterface(), cfg.GetRootURL(), db)
		if err != nil {
			log.Println("error getting sonos:", err)
		} else {
			log.Println("sonos configured")
			dev = s
			hub = NewHub(dev)
			go hub.Run()
		}
	}()

	cacheTime := 30 * 24 * time.Hour
	lastFm = lastfm.NewLastFM(cfg.LastFMAPIKey, filepath.Join(cfg.CacheDirectory, "lastfm"), cacheTime)
	spot, _ = spotify.NewSpotifyClient(cfg.SpotifyClientID, cfg.SpotifyClientSecret, filepath.Join(cfg.CacheDirectory, "spotify"), cacheTime)

	log.Println("starting http server")
	mux := http.NewServeMux()
	mux.Handle("/api/login", HandlerFunc(LoginHandler))
	mux.Handle("/api/track/", HandlerFunc(TrackHandler))
	mux.Handle("/api/tracks", HandlerFunc(TracksHandler))
	mux.Handle("/api/tracks/count", HandlerFunc(TrackCount))
	mux.Handle("/api/playlists", HandlerFunc(ListPlaylists))
	mux.Handle("/api/playlist/", HandlerFunc(PlaylistHandler))
	mux.Handle("/api/index/genres", HandlerFunc(ListGenres))
	mux.Handle("/api/index/artists", HandlerFunc(ListArtists))
	mux.Handle("/api/index/albums", HandlerFunc(ListAlbums))
	mux.Handle("/api/index/album-artist", HandlerFunc(ListAlbumsByArtist))
	mux.Handle("/api/index/songs", HandlerFunc(ListSongs))
	mux.Handle("/api/art/track/", HandlerFunc(TrackArt))
	mux.Handle("/api/art/artist", HandlerFunc(ArtistArt))
	mux.Handle("/api/art/album", HandlerFunc(AlbumArt))
	mux.Handle("/api/art/genre", HandlerFunc(GenreArt))
	//mux.HandleFunc("/api/trackCount", TrackCount)
	//mux.HandleFunc("/api/cover/", GetTrackCover)
	mux.Handle("/api/sonos/available", HandlerFunc(HasSonos))
	mux.Handle("/api/sonos/queue", HandlerFunc(SonosQueue))
	mux.Handle("/api/sonos/skip", HandlerFunc(SonosSkip))
	mux.Handle("/api/sonos/seek", HandlerFunc(SonosSeek))
	mux.Handle("/api/sonos/play", HandlerFunc(SonosPlay))
	mux.Handle("/api/sonos/pause", HandlerFunc(SonosPause))
	mux.Handle("/api/sonos/volume", HandlerFunc(SonosVolume))
	mux.HandleFunc("/api/sonos/ws", ServeWS)
	mux.Handle("/", http.FileServer(http.Dir(cfg.StaticRoot)))
	lm := &LogMux{ mux: mux }
	if cfg.UseSSL() {
		err = http.ListenAndServeTLS(fmt.Sprintf(":%d", cfg.Port), cfg.SSLCertFile, cfg.SSLKeyFile, lm)
	} else {
		err = http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), lm)
	}
	log.Println(err)
}

type ResponseLogger struct {
	w http.ResponseWriter
	StatusCode int
}

func (rl *ResponseLogger) Header() http.Header {
	return rl.w.Header()
}

func (rl *ResponseLogger) Write(data []byte) (int, error) {
	if rl.StatusCode == 0 {
		rl.StatusCode = http.StatusOK
	}
	return rl.w.Write(data)
}

func (rl *ResponseLogger) WriteHeader(statusCode int) {
	rl.StatusCode = statusCode
	rl.w.WriteHeader(statusCode)
}

func (rl *ResponseLogger) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hj, ok := rl.w.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("webserver doesn't support hijacking")
		http.Error(rl, "webserver doesn't support hijacking", http.StatusInternalServerError)
	}
	return hj.Hijack()
}

type LogMux struct {
	mux *http.ServeMux
}

func (lm *LogMux) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	//log.Println("Serving", r.Method, r.URL.String())
	rl := &ResponseLogger{w: w}
	lm.mux.ServeHTTP(rl, r)
	log.Println(r.Method, r.URL.String(), "responded with HTTP", rl.StatusCode)
}
