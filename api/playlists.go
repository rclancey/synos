package api

import (
	"bytes"
	"encoding/gob"
	"log"
	"net/http"
	"path"
	"strconv"
	"strings"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/itunes/loader"
	"github.com/rclancey/itunes/persistentId"
	"github.com/rclancey/synos/musicdb"
)

func PlaylistAPI(router H.Router, authmw H.Middleware) {
	router.GET("/playlists", authmw(H.HandlerFunc(ListPlaylists)))
	router.GET("/playlists/:id", authmw(H.HandlerFunc(ListPlaylists)))
	router.GET("/playlist/:id", authmw(H.HandlerFunc(GetPlaylist)))
	router.GET("/playlist/:id/tracks", authmw(H.HandlerFunc(PlaylistTracks)))
	router.GET("/playlist/:id/tracks.m3u", authmw(H.HandlerFunc(PlaylistTracks)))
	router.GET("/playlist/:id/track_ids", authmw(H.HandlerFunc(PlaylistTrackIDs)))
	router.GET("/playlist/:id/track-ids", authmw(H.HandlerFunc(PlaylistTrackIDs)))
	router.POST("/playlist", authmw(H.HandlerFunc(CreatePlaylist)))
	router.PUT("/playlist/:id/tracks", authmw(H.HandlerFunc(EditPlaylistTracks)))
	router.PUT("/playlist/:id", authmw(H.HandlerFunc(EditPlaylist)))
	router.PATCH("/playlist/:id", authmw(H.HandlerFunc(AppendPlaylistTracks)))
	router.DELETE("/playlist/:id", authmw(H.HandlerFunc(DeletePlaylist)))
	router.PUT("/shared/:id", authmw(H.HandlerFunc(SharePlaylist)))
	router.DELETE("/shared/:id", authmw(H.HandlerFunc(UnsharePlaylist)))
	router.GET("/itunes-playlist/:id", authmw(H.HandlerFunc(GetItunesPlaylist)))
}

/*
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
*/

func GetPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
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

func GetItunesPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	qs := `SELECT data FROM itunes_playlist WHERE id = ?`
	row := db.QueryRow(qs, id.String())
	var data []byte
	err = row.Scan(&data)
	if err != nil {
		return nil, err
	}
	buf := bytes.NewBuffer(data)
	dec := gob.NewDecoder(buf)
	obj := &loader.Playlist{}
	err = dec.Decode(obj)
	if err != nil {
		return nil, err
	}
	return obj, nil
}

func PlaylistTrackIDs(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	log.Println("PlaylistTrackIDs")
	user := getUser(req)
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	log.Println("pid =", id)
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, err
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.Folder {
		return nil, H.BadRequest.Wrapf(nil, "can't get track ids for playlist folders")
	}
	if pl.Smart != nil {
		tracks, err := db.SmartTracks(pl.Smart)
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
		trackIds := make([]pid.PersistentID, len(tracks))
		for i, tr := range tracks {
			trackIds[i] = tr.PersistentID
		}
		return trackIds, nil
	}
	return db.PlaylistTrackIDs(pl)
}

func PlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, err
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.Folder {
		return nil, H.BadRequest.Wrapf(nil, "can't get track ids for playlist folders")
	}
	var tracks []*musicdb.Track
	if pl.Smart != nil {
		tracks, err = db.SmartTracks(pl.Smart)
	} else {
		tracks, err = db.PlaylistTracks(pl)
	}
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	ext := path.Ext(req.URL.Path)
	if ext == ".m3u" {
		lines, err := M3U(tracks)
		if err != nil {
			return nil, H.InternalServerError.Wrap(err, "")
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
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	pl := musicdb.NewPlaylist()
	err := H.ReadJSON(req, pl)
	if err != nil {
		return nil, err
	}
	pl.OwnerID = user.PersistentID
	if pl.Folder {
		pl.PlaylistItems = nil
		pl.TrackIDs = nil
		pl.Children = []*musicdb.Playlist{}
		pl.Smart = nil
	} else {
		if pl.Smart == nil {
			if pl.PlaylistItems != nil && len(pl.PlaylistItems) > 0 {
				pl.TrackIDs = make([]pid.PersistentID, len(pl.PlaylistItems))
				for i, tr := range pl.PlaylistItems {
					pl.TrackIDs[i] = tr.PersistentID
				}
				pl.PlaylistItems = nil
			} else if pl.TrackIDs == nil {
				pl.TrackIDs = []pid.PersistentID{}
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
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.NoSuchPlaylistFolder:
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.ParentNotAFolder:
			return nil, H.BadRequest.Wrap(err, "")
		default:
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	if !pl.Folder {
		if pl.Smart != nil {
			pl.PlaylistItems, err = db.SmartTracks(pl.Smart)
		} else {
			pl.PlaylistItems, err = db.PlaylistTracks(pl)
		}
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	return pl, nil
}

func EditPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.OwnerID != user.PersistentID {
		return nil, H.Forbidden
	}
	if !pl.Folder && pl.Smart == nil {
		pl.TrackIDs, err = db.PlaylistTrackIDs(pl)
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	xpl := &musicdb.Playlist{}
	err = H.ReadJSON(req, xpl)
	if err != nil {
		return nil, err
	}
	parent := xpl
	for parent.ParentPersistentID != nil {
		if *parent.ParentPersistentID == id {
			return nil, H.BadRequest.Wrap(nil, "playlist can't be a descendant of itself")
		}
		parent, err = db.GetPlaylist(*parent.ParentPersistentID, user)
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
		if parent == nil {
			break
		}
		if parent.OwnerID != user.PersistentID {
			return nil, H.Forbidden
		}
		if !parent.Folder {
			return nil, H.BadRequest.Wrap(nil, "playlist can only be a descendant of a folder")
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
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.NoSuchPlaylistFolder:
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.ParentNotAFolder:
			return nil, H.BadRequest.Wrap(err, "")
		default:
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	if !pl.Folder {
		if pl.Smart != nil {
			pl.PlaylistItems, err = db.SmartTracks(pl.Smart)
		} else {
			pl.PlaylistItems, err = db.PlaylistTracks(pl)
		}
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	return pl, nil
}

func EditPlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.OwnerID != user.PersistentID {
		return nil, H.Forbidden
	}
	if pl.Folder {
		return nil, H.BadRequest.Wrap(nil, "can't modify folder tracks")
	}
	if pl.Smart != nil {
		return nil, H.BadRequest.Wrap(nil, "can't modify smart playlist tracks")
	}
	if pl.GeniusTrackID != nil {
		return nil, H.BadRequest.Wrap(nil, "can't modify genius playlist tracks")
	}
	tracks := []*musicdb.Track{}
	err = H.ReadJSON(req, &tracks)
	if err != nil {
		return nil, err
	}
	pl.TrackIDs = make([]pid.PersistentID, len(tracks))
	for i, tr := range tracks {
		pl.TrackIDs[i] = tr.PersistentID
	}
	err = db.SavePlaylistTracks(pl)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return pl, nil
}

func AppendPlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.OwnerID != user.PersistentID {
		return nil, H.Forbidden
	}
	if pl.Folder {
		return nil, H.BadRequest.Wrap(nil, "can't modify folder tracks")
	}
	if pl.Smart != nil {
		return nil, H.BadRequest.Wrap(nil, "can't modify smart playlist tracks")
	}
	if pl.GeniusTrackID != nil {
		return nil, H.BadRequest.Wrap(nil, "can't modify genius playlist tracks")
	}
	tracks := []*musicdb.Track{}
	err = H.ReadJSON(req, &tracks)
	if err != nil {
		return nil, err
	}
	trackIds := make([]pid.PersistentID, len(tracks))
	for i, tr := range tracks {
		trackIds[i] = tr.PersistentID
	}
	pl.TrackIDs, err = db.PlaylistTrackIDs(pl)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	pl.TrackIDs = append(pl.TrackIDs, trackIds...)
	err = db.SavePlaylistTracks(pl)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return pl, nil
}

func DeletePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.OwnerID != user.PersistentID {
		return nil, H.Forbidden
	}
	if !pl.Folder && pl.Smart == nil {
		pl.TrackIDs, _ = db.PlaylistTrackIDs(pl)
	}
	err = db.DeletePlaylist(pl)
	if err != nil {
		switch err {
		case musicdb.PlaylistFolderNotEmpty:
			return nil, H.BadRequest.Wrap(err, "")
		default:
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	return pl, nil
}

func ListPlaylists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	fwds := H.Forwarded(req)
	xfp := req.Header.Get("X-Forwarded-Proto")
	log.Printf("Scheme = %s; TLS = %t; fwd = %s; fwds = %v; xfp = %s", req.URL.Scheme, (req.TLS != nil), req.Header.Get("Forwarded"), fwds, xfp)
	user := getUser(req)
	var ppid *pid.PersistentID = nil
	pathPid := pathVar(req, "id")
	if pathPid != "" {
		id, err := getPathId(req)
		if err != nil {
			return nil, err
		}
		ppid = &id
	}
	pls, err := db.GetPlaylistTree(ppid, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return pls, nil
}

func SharePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.OwnerID != user.PersistentID {
		return nil, H.Forbidden
	}
	pl.Shared = true
	err = db.SavePlaylist(pl)
	if err != nil {
		switch err {
		case musicdb.CircularPlaylistFolder:
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.NoSuchPlaylistFolder:
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.ParentNotAFolder:
			return nil, H.BadRequest.Wrap(err, "")
		default:
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	return pl, nil
}

func UnsharePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Forbidden
	}
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	pl, err := db.GetPlaylist(id, user)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if pl == nil {
		return nil, H.NotFound.Wrapf(nil, "playlist %s does not exist", id)
	}
	if pl.OwnerID != user.PersistentID {
		return nil, H.Forbidden
	}
	pl.Shared = false
	err = db.SavePlaylist(pl)
	if err != nil {
		switch err {
		case musicdb.CircularPlaylistFolder:
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.NoSuchPlaylistFolder:
			return nil, H.BadRequest.Wrap(err, "")
		case musicdb.ParentNotAFolder:
			return nil, H.BadRequest.Wrap(err, "")
		default:
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	return pl, nil
}
