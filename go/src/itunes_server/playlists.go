package main

import (
	"fmt"
	"html"
	"log"
	"net/http"
	"path"
	"sort"
	"strconv"
	"strings"

	"itunes"
)

func ListPlaylists(w http.ResponseWriter, req *http.Request) {
	log.Println("getting playlists")
	pls := make([]*itunes.Playlist, 0, len(lib.Playlists))
	for _, pl := range lib.PlaylistTree {
		pls = append(pls, pl.Prune())
	}
	sort.Sort(itunes.SortablePlaylistList(pls))
	SendJSON(w, pls)
}

func PlaylistHandler(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		PlaylistTracks(w, req)
	case http.MethodPost:
		CreatePlaylist(w, req)
	case http.MethodPut:
		EditPlaylist(w, req)
	case http.MethodPatch:
		EditPlaylistTracks(w, req)
	case http.MethodDelete:
		DeletePlaylist(w, req)
	default:
		MethodNotAllowed.Raise(nil, "").RespondJSON(w)
	}
}

func PlaylistTracks(w http.ResponseWriter, req *http.Request) {
	fn := path.Base(req.URL.Path)
	id := new(itunes.PersistentID)
	ext := path.Ext(fn)
	if ext != "" {
		id.DecodeString(strings.TrimSuffix(fn, ext))
	} else {
		id.DecodeString(fn)
	}
	pl, ok := lib.Playlists[*id]
	if !ok {
		NotFound.Raise(nil, "playlist %s not found", id).Respond(w)
		return
	}
	if ext == ".m3u" {
		lines, err := M3U(pl.Populate(lib))
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
		pl = pl.Populate(lib)
		SendJSON(w, pl.PlaylistItems)
	} else if req.URL.Query().Get("raw") == "true" {
		pl = pl.Populate(lib)
		SendJSON(w, pl)
	} else if req.URL.Query().Get("struct") == "true" {
		SendJSON(w, pl)
	} else {
		var trackIds []itunes.PersistentID
		if pl.Smart != nil {
			tl, err := lib.TrackList().SmartFilter(pl.Smart, lib)
			if err != nil {
				InternalServerError.Raise(err, "").Respond(w)
				return
			}
			trackIds = make([]itunes.PersistentID, len(*tl))
			for i, tr := range *tl {
				trackIds[i] = tr.PersistentID
			}
		} else {
			trackIds = pl.TrackIDs
		}
		SendJSON(w, trackIds)
	}
}

func m3uEscape(s string) string {
	s = html.EscapeString(s)
	s = strings.Replace(s, "&amp;", "%26", -1)
	s = strings.Replace(s, "&lt;", "&#60;", -1)
	s = strings.Replace(s, "&gt;", "&#62;", -1)
	return s
}

func M3U(pl *itunes.Playlist) ([]string, error) {
	lines := make([]string, len(pl.PlaylistItems) * 2 + 2)
	lines[0] = "#EXTM3U"
	for i, track := range pl.PlaylistItems {
		if track == nil {
			continue
		}
		var t uint
		var album, artist, song string
		if track.TotalTime != 0 {
			t = track.TotalTime / 1000
		}
		if track.Album != "" {
			album = track.Album
		}
		if track.Artist != "" {
			artist = track.Artist
		}
		if track.Name != "" {
			song = track.Name
		}
		u := cfg.GetRootURL()
		u.Path = fmt.Sprintf("/api/track/%s%s", track.PersistentID.EncodeToString(), track.GetExt())
		lines[i * 2 + 1] = fmt.Sprintf("#EXTINF:%d,<%s><%s><%s>", t, m3uEscape(artist), m3uEscape(album), m3uEscape(song))
		lines[i * 2 + 2] = u.String()
	}
	return lines, nil
}

func boolptr(v bool) *bool {
	return &v
}

func CreatePlaylist(w http.ResponseWriter, req *http.Request) {
	pl := &itunes.Playlist{}
	herr := ReadJSON(req, pl)
	if herr != nil {
		herr.RespondJSON(w)
		return
	}
	pl.PlaylistPersistentID = itunes.NewPersistentID()
	if pl.Folder {
		pl.PlaylistItems = nil
		pl.TrackIDs = nil
		pl.Children = []*itunes.Playlist{}
		pl.Smart = nil
	} else {
		if pl.PlaylistItems != nil {
			pl.TrackIDs = make([]itunes.PersistentID, len(pl.PlaylistItems))
			for i, tr := range pl.PlaylistItems {
				pl.TrackIDs[i] = tr.PersistentID
			}
			pl.PlaylistItems = nil
		} else {
			pl.TrackIDs = []itunes.PersistentID{}
		}
	}
	pl.GeniusTrackID = nil
}

func EditPlaylist(w http.ResponseWriter, req *http.Request) {
}

func EditPlaylistTracks(w http.ResponseWriter, req *http.Request) {
}

func DeletePlaylist(w http.ResponseWriter, req *http.Request) {
}

