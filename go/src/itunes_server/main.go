package main

import (
	"fmt"
	"log"
	"net/http"

	"itunes"
	"sonos"
)

var lib *itunes.Library
var dev *sonos.Sonos
var cfg *SynosConfig

func main() {
	var err error
	cfg, err = Configure()
	if err != nil {
		log.Fatal("error configuring server:", err)
	}
	lib = itunes.NewLibrary(cfg.FileFinder())

	go func() {
		s, err := sonos.NewSonos(cfg.NetworkInterface(), cfg.GetRootURL(), lib)
		if err != nil {
			log.Println("error getting sonos:", err)
		} else {
			log.Println("sonos configured")
			dev = s
		}
	}()

	fn, err := cfg.FindLibrary()
	if err != nil {
		log.Fatal("error locating itunes library:", err)
	}

	go func() {
		log.Println("loading library", fn)
		err = lib.Load(fn)
		if err != nil {
			log.Println(err)
			return
		}
		log.Println("library loaded")
		lib.Index()
		log.Printf("%d tracks in library\n", len(lib.TrackList))
		for _, pl := range lib.PlaylistIDIndex {
			if (pl.Folder == nil || *pl.Folder == false) && pl.SmartInfo != nil && len(pl.SmartInfo) > 0 && pl.SmartCriteria != nil && len(pl.SmartCriteria) > 0 {
				s, err := itunes.ParseSmartPlaylist(pl.SmartInfo, pl.SmartCriteria)
				if err != nil {
					log.Println("bad playlist", *pl.PlaylistPersistentID, err)
					log.Println("info:", string(pl.SmartInfo))
					log.Println("criteria:", string(pl.SmartCriteria))
				} else {
					pl.Smart = s
				}
			}
		}
	}()

	go func() {
		for _, tr := range lib.Tracks {
			tr.GetPurchaseDate()
		}
		log.Println("purchase dates loaded")
	}()

	log.Println("starting http server")
	mux := http.NewServeMux()
	mux.HandleFunc("/api/index/genres", ListGenres)
	mux.HandleFunc("/api/index/artists", ListArtists)
	mux.HandleFunc("/api/index/albums", ListAlbums)
	mux.HandleFunc("/api/index/songs", ListSongs)
	//mux.HandleFunc("/api/art/genre", GenreArt)
	mux.HandleFunc("/api/art/artist", ArtistArt)
	mux.HandleFunc("/api/art/album", AlbumArt)
	mux.HandleFunc("/api/trackCount", TrackCount)
	mux.HandleFunc("/api/tracks", ListTracks)
	mux.HandleFunc("/api/track/", GetTrack)
	mux.HandleFunc("/api/cover/", GetTrackCover)
	mux.HandleFunc("/api/playlists", ListPlaylists)
	mux.HandleFunc("/api/playlist/", PlaylistTracks)
	mux.HandleFunc("/api/sonos/available", HasSonos)
	mux.HandleFunc("/api/sonos/queue", SonosQueue)
	mux.HandleFunc("/api/sonos/skip", SonosSkip)
	mux.HandleFunc("/api/sonos/seek", SonosSeek)
	mux.HandleFunc("/api/sonos/play", SonosPlay)
	mux.HandleFunc("/api/sonos/pause", SonosPause)
	err = http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), mux)
	log.Println(err)
}

