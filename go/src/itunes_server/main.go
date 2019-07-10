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

	"itunes"
	"lastfm"
	"sonos"
	"spotify"
)

var lib *itunes.Library
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
	itunes.SetGlobalFinder(cfg.FileFinder())
	lib = itunes.NewLibrary()

	go func() {
		s, err := sonos.NewSonos(cfg.NetworkInterface(), cfg.GetRootURL(), lib)
		if err != nil {
			log.Println("error getting sonos:", err)
		} else {
			log.Println("sonos configured")
			dev = s
			hub = NewHub(dev)
			go hub.Run()
		}
	}()

	fn, err := cfg.FindLibrary()
	if err != nil {
		log.Fatal("error locating itunes library:", err)
	}

	go func() {
		log.Println("loading library", fn)
		//time.Sleep(time.Duration(5) * time.Second)
		BootstrapPlaylists()
		MonitorLibrary(fn)
		/*
		err = lib.Load(fn)
		if err != nil {
			log.Println(err)
			return
		}
		log.Println("loading purchase dates")
		for _, tr := range lib.Tracks {
			tr.GetPurchaseDate()
		}
		log.Println("purchase dates loaded")
		runtime.GC()
		debug.FreeOSMemory()
		log.Printf("%d tracks in library\n", len(lib.Tracks))
		*/
	}()

	cacheTime := 30 * 24 * time.Hour
	lastFm = lastfm.NewLastFM(cfg.LastFMAPIKey, filepath.Join(cfg.CacheDirectory, "lastfm"), cacheTime)
	spot, _ = spotify.NewSpotifyClient(cfg.SpotifyClientID, cfg.SpotifyClientSecret, filepath.Join(cfg.CacheDirectory, "spotify"), cacheTime)

	log.Println("starting http server")
	mux := http.NewServeMux()
	mux.HandleFunc("/api/index/genres", ListGenres)
	mux.HandleFunc("/api/index/artists", ListArtists)
	mux.HandleFunc("/api/index/albums", ListAlbums)
	mux.HandleFunc("/api/index/album-artist", ListAlbumsWithArtist)
	mux.HandleFunc("/api/index/songs", ListSongs)
	//mux.HandleFunc("/api/art/genre", GenreArt)
	mux.HandleFunc("/api/art/artist", ArtistArt)
	mux.HandleFunc("/api/art/album", AlbumArt)
	mux.HandleFunc("/api/art/genre", GenreArt)
	mux.HandleFunc("/api/trackCount", TrackCount)
	mux.HandleFunc("/api/tracks", ListTracks)
	mux.HandleFunc("/api/track/", GetTrack)
	mux.HandleFunc("/api/cover/", GetTrackCover)
	mux.HandleFunc("/api/playlists", ListPlaylists)
	mux.HandleFunc("/api/playlist/", PlaylistHandler)
	mux.HandleFunc("/api/sonos/available", HasSonos)
	mux.HandleFunc("/api/sonos/queue", SonosQueue)
	mux.HandleFunc("/api/sonos/skip", SonosSkip)
	mux.HandleFunc("/api/sonos/seek", SonosSeek)
	mux.HandleFunc("/api/sonos/play", SonosPlay)
	mux.HandleFunc("/api/sonos/pause", SonosPause)
	mux.HandleFunc("/api/sonos/volume", SonosVolume)
	mux.HandleFunc("/api/sonos/ws", ServeWS)
	mux.Handle("/", http.FileServer(http.Dir(cfg.StaticRoot)))
	lm := &LogMux{ mux: mux }
	err = http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), lm)
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
	log.Println("Serving", r.Method, r.URL.String())
	rl := &ResponseLogger{w: w}
	lm.mux.ServeHTTP(rl, r)
	log.Println(r.Method, r.URL.String(), "responded with HTTP", rl.StatusCode)
}
