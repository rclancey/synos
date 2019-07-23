package main

import (
	//"fmt"
	"log"
	//"net/http"

	"httpserver"
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
	srv, err := httpserver.NewServer(cfg.ServerConfig)
	if err != nil {
		log.Fatal(err)
	}
	cfg.Finder.FileFinder()
	db, err = cfg.Database.DB()
	if err != nil {
		log.Fatal("error connecting to music database:", err)
	}

	errlog, err := cfg.Logging.ErrorLogger()
	if err != nil {
		log.Fatal("error sending default log messages to error log:", err)
	}
	errlog.MakeDefault()
	iface := cfg.Sonos.GetInterface()
	if iface == nil {
		log.Println("sonos not configured")
	} else {
		go func() {
			s, err := sonos.NewSonos(iface.Name, cfg.Bind.RootURL(cfg.Sonos, false), db)
			if err != nil {
				log.Println("error getting sonos:", err)
			} else {
				log.Println("sonos ready")
				dev = s
				hub = NewHub(dev)
				go hub.Run()
			}
		}()
	}

	lastFm = cfg.LastFM.Client()
	spot = cfg.Spotify.Client()

	_, err = WatchITunes()
	if err != nil {
		errlog.Error(err)
	}

	srv.Handle("/api/login", cfg.Auth.LoginHandler())
	srv.Handle("/api/track/", TrackHandler)
	srv.Handle("/api/tracks", TracksHandler)
	srv.Handle("/api/tracks/count", TrackCount)
	srv.Handle("/api/playlists", ListPlaylists)
	srv.Handle("/api/playlist/", PlaylistHandler)
	srv.Handle("/api/index/genres", ListGenres)
	srv.Handle("/api/index/artists", ListArtists)
	srv.Handle("/api/index/albums", ListAlbums)
	srv.Handle("/api/index/album-artist", ListAlbumsByArtist)
	srv.Handle("/api/index/songs", ListSongs)
	srv.Handle("/api/art/track/", TrackArt)
	srv.Handle("/api/art/artist", ArtistArt)
	srv.Handle("/api/art/album", AlbumArt)
	srv.Handle("/api/art/genre", GenreArt)
	srv.Handle("/api/sonos/available", HasSonos)
	srv.Handle("/api/sonos/queue", SonosQueue)
	srv.Handle("/api/sonos/skip", SonosSkip)
	srv.Handle("/api/sonos/seek", SonosSeek)
	srv.Handle("/api/sonos/play", SonosPlay)
	srv.Handle("/api/sonos/pause", SonosPause)
	srv.Handle("/api/sonos/volume", SonosVolume)
	srv.Handle("/api/sonos/ws", ServeWS)

	srv.ListenAndServe()
}
