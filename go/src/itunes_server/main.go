package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"itunes"
)

var lib *itunes.Library

func main() {
	lib = itunes.NewLibrary()
	var fn string
	if len(os.Args) > 1 {
		fn, _ = filepath.Abs(os.Args[1])
	} else {
		fn = filepath.Join(os.Getenv("HOME"), "Music", "iTunes", "iTunes Music Library.xml")
	}
	log.Println("loading library", fn)
	err := lib.Load(fn)
	if err != nil {
		log.Println(err)
		return
	}
	log.Println("library loaded")
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
	log.Println("starting http server")
	mux := http.NewServeMux()
	mux.HandleFunc("/api/trackCount", TrackCount)
	mux.HandleFunc("/api/tracks", ListTracks)
	mux.HandleFunc("/api/track/", GetTrack)
	mux.HandleFunc("/api/cover/", GetTrackCover)
	mux.HandleFunc("/api/playlists", ListPlaylists)
	mux.HandleFunc("/api/playlist/", PlaylistTracks)
	err = http.ListenAndServe(":8182", mux)
	log.Println(err)
}

