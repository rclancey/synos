package main

import (
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"

	H "httpserver"
	"musicdb"
)

func PlaylistHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	log.Println("PlaylistHandler")
	switch req.Method {
	case http.MethodGet:
		action := path.Base(req.URL.Path)
		log.Println(action)
		switch action {
		case "tracks", "tracks.m3u":
			return PlaylistTracks(w, req)
		case "track_ids", "track-ids":
			return PlaylistTrackIDs(w, req)
		default:
			return GetPlaylist(w, req)
		}
	case http.MethodPost:
		return CreatePlaylist(w, req)
	case http.MethodPut:
		action := path.Base(req.URL.Path)
		switch action {
		case "tracks":
			return EditPlaylistTracks(w, req)
		default:
			return EditPlaylist(w, req)
		}
	case http.MethodPatch:
		return AppendPlaylistTracks(w, req)
	case http.MethodDelete:
		return DeletePlaylist(w, req)
	default:
		return nil, H.MethodNotAllowed
	}
}

func GetPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if !pl.Folder {
		if pl.Smart != nil {
			pl.PlaylistItems, err = db.SmartTracks(pl.Smart)
		}  else {
			pl.PlaylistItems, err = db.PlaylistTracks(pl)
		}
		if err != nil {
			return nil, err
		}
	}
	return pl, nil
}

func PlaylistTrackIDs(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	log.Println("PlaylistTrackIDs")
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	log.Println("pid =", pid)
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, err
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if pl.Folder {
		return nil, H.BadRequest.Raise(nil, "can't get track ids for playlist folders")
	}
	if pl.Smart != nil {
		tracks, err := db.SmartTracks(pl.Smart)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		trackIds := make([]musicdb.PersistentID, len(tracks))
		for i, tr := range tracks {
			trackIds[i] = tr.PersistentID
		}
		return trackIds, nil
	}
	return db.PlaylistTrackIDs(pl)
}

func PlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, err
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if pl.Folder {
		return nil, H.BadRequest.Raise(nil, "can't get track ids for playlist folders")
	}
	var tracks []*musicdb.Track
	if pl.Smart != nil {
		tracks, err = db.SmartTracks(pl.Smart)
	} else {
		tracks, err = db.PlaylistTracks(pl)
	}
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	ext := path.Ext(req.URL.Path)
	if ext == ".m3u" {
		lines, err := M3U(pl)
		if err != nil {
			return nil, H.InternalServerError.Raise(err, "")
		}
		data := []byte(strings.Join(lines, "\n"))
		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		w.WriteHeader(http.StatusOK)
		w.Write(data)
		return nil, nil
	}
	return tracks, nil
}

func CreatePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	pl := musicdb.NewPlaylist()
	err = H.ReadJSON(req, pl)
	if err != nil {
		return nil, err
	}
	if pl.Folder {
		pl.PlaylistItems = nil
		pl.TrackIDs = nil
		pl.Children = []*musicdb.Playlist{}
		pl.Smart = nil
	} else {
		if pl.Smart == nil {
			if pl.PlaylistItems != nil && len(pl.PlaylistItems) > 0 {
				pl.TrackIDs = make([]musicdb.PersistentID, len(pl.PlaylistItems))
				for i, tr := range pl.PlaylistItems {
					pl.TrackIDs[i] = tr.PersistentID
				}
				pl.PlaylistItems = nil
			} else if pl.TrackIDs == nil {
				pl.TrackIDs = []musicdb.PersistentID{}
			}
		} else {
			pl.TrackIDs = nil
		}
	}
	pl.GeniusTrackID = nil
	err = db.SavePlaylist(pl)
	if err != nil {
		switch err {
		case musicdb.CircularPlaylistFolder:
			return nil, H.BadRequest.Raise(err, "")
		case musicdb.NoSuchPlaylistFolder:
			return nil, H.BadRequest.Raise(err, "")
		case musicdb.ParentNotAFolder:
			return nil, H.BadRequest.Raise(err, "")
		default:
			return nil, DatabaseError.Raise(err, "")
		}
	}
	if !pl.Folder {
		if pl.Smart != nil {
			pl.PlaylistItems, err = db.SmartTracks(pl.Smart)
		} else {
			pl.PlaylistItems, err = db.PlaylistTracks(pl)
		}
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
	}
	return pl, nil
}

func EditPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if !pl.Folder && pl.Smart == nil {
		pl.TrackIDs, err = db.PlaylistTrackIDs(pl)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
	}
	xpl := &musicdb.Playlist{}
	err = H.ReadJSON(req, xpl)
	if err != nil {
		return nil, err
	}
	parent := xpl
	for parent.ParentPersistentID != nil {
		if *parent.ParentPersistentID == pid {
			return nil, H.BadRequest.Raise(nil, "playlist can't be a descendant of itself")
		}
		parent, err = db.GetPlaylist(*parent.ParentPersistentID)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		if parent == nil {
			break
		}
		if !parent.Folder {
			return nil, H.BadRequest.Raise(nil, "playlist can only be a descendant of a folder")
		}
	}
	pl.ParentPersistentID = xpl.ParentPersistentID
	if !pl.Folder && pl.Smart != nil && xpl.Smart != nil {
		pl.Smart = xpl.Smart
	}
	pl.SortField = xpl.SortField
	pl.Name = xpl.Name
	err = db.SavePlaylist(pl)
	if err != nil {
		switch err {
		case musicdb.CircularPlaylistFolder:
			return nil, H.BadRequest.Raise(err, "")
		case musicdb.NoSuchPlaylistFolder:
			return nil, H.BadRequest.Raise(err, "")
		case musicdb.ParentNotAFolder:
			return nil, H.BadRequest.Raise(err, "")
		default:
			return nil, DatabaseError.Raise(err, "")
		}
	}
	if !pl.Folder {
		if pl.Smart != nil {
			pl.PlaylistItems, err = db.SmartTracks(pl.Smart)
		} else {
			pl.PlaylistItems, err = db.PlaylistTracks(pl)
		}
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
	}
	return pl, nil
}

func EditPlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if pl.Folder {
		return nil, H.BadRequest.Raise(nil, "can't modify folder tracks")
	}
	if pl.Smart != nil {
		return nil, H.BadRequest.Raise(nil, "can't modify smart playlist tracks")
	}
	if pl.GeniusTrackID != nil {
		return nil, H.BadRequest.Raise(nil, "can't modify genius playlist tracks")
	}
	tracks := []*musicdb.Track{}
	err = H.ReadJSON(req, &tracks)
	if err != nil {
		return nil, err
	}
	pl.TrackIDs = make([]musicdb.PersistentID, len(tracks))
	for i, tr := range tracks {
		pl.TrackIDs[i] = tr.PersistentID
	}
	err = db.SavePlaylistTracks(pl)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return pl, nil
}

func AppendPlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if pl.Folder {
		return nil, H.BadRequest.Raise(nil, "can't modify folder tracks")
	}
	if pl.Smart != nil {
		return nil, H.BadRequest.Raise(nil, "can't modify smart playlist tracks")
	}
	if pl.GeniusTrackID != nil {
		return nil, H.BadRequest.Raise(nil, "can't modify genius playlist tracks")
	}
	tracks := []*musicdb.Track{}
	err = H.ReadJSON(req, &tracks)
	if err != nil {
		return nil, err
	}
	trackIds := make([]musicdb.PersistentID, len(tracks))
	for i, tr := range tracks {
		trackIds[i] = tr.PersistentID
	}
	pl.TrackIDs, err = db.PlaylistTrackIDs(pl)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	pl.TrackIDs = append(pl.TrackIDs, trackIds...)
	err = db.SavePlaylistTracks(pl)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return pl, nil
}

func DeletePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(pid)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Raise(nil, "playlist %s does not exist", pid)
	}
	if !pl.Folder && pl.Smart == nil {
		pl.TrackIDs, _ = db.PlaylistTrackIDs(pl)
	}
	err = db.DeletePlaylist(pl)
	if err != nil {
		switch err {
		case musicdb.PlaylistFolderNotEmpty:
			return nil, H.BadRequest.Raise(err, "")
		default:
			return nil, DatabaseError.Raise(err, "")
		}
	}
	return pl, nil
}

func ListPlaylists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	pls, err := db.GetPlaylistTree(nil)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return pls, nil
}

