package main

import (
	"fmt"
	"html"
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"

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
	fn := path.Base(req.URL.Path)
	var id string
	ext := path.Ext(fn)
	if ext != "" {
		id = strings.TrimSuffix(fn, ext)
	} else {
		id = fn
	}
	pl, ok := lib.PlaylistIDIndex[id]
	if !ok {
		NotFound.Raise(nil, "playlist %s not found", id).Respond(w)
		return
	}
	if ext == ".m3u" {
		lines, err := M3U(pl)
		if err != nil {
			InternalServerError.Raise(err, "").Respond(w)
			return
		}
		data := []byte(strings.Join(lines, "\n"))
		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		w.WriteHeader(http.StatusOK)
		w.Write(data)
		return
	}
	full := req.URL.Query().Get("full")
	if full == "true" {
		SendJSON(w, pl.PlaylistItems)
	} else {
		trackIds := make([]string, 0, len(pl.PlaylistItems))
		for _, t := range pl.PlaylistItems {
			if t.PersistentID != nil {
				trackIds = append(trackIds, *t.PersistentID)
			}
		}
		SendJSON(w, trackIds)
	}
}

func M3U(pl *itunes.Playlist) ([]string, error) {
	lines := make([]string, len(pl.PlaylistItems) * 2 + 2)
	lines[0] = "#EXTM3U"
	for i, track := range pl.PlaylistItems {
		if track.PersistentID == nil {
			continue
		}
		var t int
		var album, artist, song string
		if track.TotalTime != nil {
			t = *track.TotalTime / 1000
		}
		if track.Album != nil {
			album = *track.Album
		}
		if track.Artist != nil {
			artist = *track.Artist
		}
		if track.Name != nil {
			song = *track.Name
		}
		u := cfg.GetRootURL()
		u.Path = fmt.Sprintf("/api/track/%s%s", *track.PersistentID, track.GetExt())
		lines[i * 2 + 1] = fmt.Sprintf("#EXTINF:%d,<%s><%s><%s>", t, html.EscapeString(artist), html.EscapeString(album), html.EscapeString(song))
		lines[i * 2 + 2] = u.String()
	}
	return lines, nil
}

