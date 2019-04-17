package main

import (
	"fmt"
	"log"
	"net/http"
	"path"

	"itunes"
)

func ListPlaylists(w http.ResponseWriter, req *http.Request) {
	log.Println("getting playlists")
	pls := make([]*itunes.Playlist, 0, len(lib.Playlists))
	for _, pl := range lib.Playlists {
		pls = append(pls, pl.Prune())
	}
	SendJSON(w, pls)
}

func PlaylistTracks(w http.ResponseWriter, req *http.Request) {
	_, id := path.Split(req.URL.Path)
	pl, ok := lib.PlaylistIDIndex[id]
	if !ok {
		HTTPError(w, http.StatusNotFound, fmt.Sprintf("playlist %s not found", id))
		return
	}
	trackIds := make([]string, 0, len(pl.PlaylistItems))
	for _, t := range pl.PlaylistItems {
		if t.PersistentID != nil {
			trackIds = append(trackIds, *t.PersistentID)
		}
	}
	SendJSON(w, trackIds)
}
