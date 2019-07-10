package main

import (
	"net/http"

	"musicdb"
)

func HasSonos(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	return dev != nil, nil
}

func SonosQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		return SonosGetQueue(w, req)
	case http.MethodPost:
		return SonosReplaceQueue(w, req)
	case http.MethodPut:
		return SonosAppendQueue(w, req)
	case http.MethodPatch:
		return SonosInsertQueue(w, req)
	case http.MethodDelete:
		return SonosClearQueue(w, req)
	default:
		return nil, MethodNotAllowed.Raise(nil, "")
	}
}

func SonosGetQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	queue, err := dev.GetQueue()
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return queue, nil
}

func readTracks(req *http.Request) ([]*musicdb.Track, error) {
	trackIds := []musicdb.PersistentID{}
	err := ReadJSON(req, &trackIds)
	if err != nil {
		return nil, err
	}
	tracks := make([]*musicdb.Track, len(trackIds))
	for i, id := range trackIds {
		track, err := db.GetTrack(id)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		if track == nil {
			return nil, NotFound.Raise(nil, "Track %s does not exist", id)
		}
		tracks[i] = track
	}
	return tracks, nil
}

func SonosReplaceQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var err error
	plid := new(musicdb.PersistentID)
	err = plid.Decode(req.URL.Query().Get("playlist"))
	if err != nil && *plid != 0 {
		var pl *musicdb.Playlist
		pl, err = db.GetPlaylist(*plid)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		if pl == nil {
			return nil, NotFound.Raise(nil, "playlist %s not found", plid)
		}
		err = dev.ReplaceQueueWithPlaylist(pl)
	} else {
		var tracks []*musicdb.Track
		tracks, err = readTracks(req)
		if err != nil {
			return nil, err
		}
		err = dev.ReplaceQueue(tracks)
	}
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	err = dev.Play()
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosAppendQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var err error
	plid := new(musicdb.PersistentID)
	err = plid.Decode(req.URL.Query().Get("playlist"))
	if err == nil && *plid != 0 {
		var pl *musicdb.Playlist
		pl, err = db.GetPlaylist(*plid)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		if pl == nil {
			return nil, NotFound.Raise(nil, "playlist %s not found", plid)
		}
		err = dev.AppendPlaylistToQueue(pl)
	} else {
		var tracks []*musicdb.Track
		tracks, err = readTracks(req)
		if err != nil {
			return nil, err
		}
		err = dev.AppendToQueue(tracks)
	}
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosInsertQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	queue, err := dev.GetQueue()
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	plid := new(musicdb.PersistentID)
	err = plid.Decode(req.URL.Query().Get("playlist"))
	if err == nil && *plid != 0 {
		var pl *musicdb.Playlist
		pl, err = db.GetPlaylist(*plid)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		if pl == nil {
			return nil, NotFound.Raise(nil, "playlist %s not found", plid)
		}
		err = dev.AppendPlaylistToQueue(pl)
		if queue.Index + 1 < len(queue.Tracks) {
			err = dev.InsertPlaylistIntoQueue(pl, queue.Index+1)
		} else {
			err = dev.AppendPlaylistToQueue(pl)
		}
	} else {
		var tracks []*musicdb.Track
		tracks, err = readTracks(req)
		if err != nil {
			return nil, err
		}
		if queue.Index + 1 < len(queue.Tracks) {
			err = dev.InsertIntoQueue(tracks, queue.Index+1)
		} else {
			err = dev.AppendToQueue(tracks)
		}
	}
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosClearQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	err := dev.ClearQueue()
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosSkip(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var count int
	err := ReadJSON(req, &count)
	if err != nil {
		return nil, err
	}
	if req.Method == http.MethodPost {
		err = dev.SetQueuePosition(count)
	} else {
		err = dev.Skip(count)
	}
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosSeek(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var ms int
	err := ReadJSON(req, &ms)
	if err != nil {
		return nil, err
	}
	if req.Method == http.MethodPut {
		err = dev.Seek(ms)
	} else {
		err = dev.SeekTo(ms)
	}
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosPlay(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	err := dev.Play()
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosPause(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	if dev == nil {
		return nil, SonosUnavailableError
	}
	err := dev.Pause()
	if err != nil {
		return nil, SonosError.Raise(err, "")
	}
	return JSONStatusOK, nil
}

func SonosVolume(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var err error
	switch req.Method {
	case http.MethodGet:
		vol, err := dev.GetVolume()
		if err != nil {
			return nil, SonosError.Raise(err, "")
		}
		return vol, nil
	case http.MethodPost:
		var vol int
		err = ReadJSON(req, &vol)
		if err != nil {
			return nil, err
		}
		err = dev.SetVolume(vol)
		if err != nil {
			return nil, SonosError.Raise(err, "")
		}
		return JSONStatusOK, nil
	case http.MethodPut:
		var delta int
		err = ReadJSON(req, &delta)
		if err != nil {
			return nil, err
		}
		err = dev.AlterVolume(delta)
		if err != nil {
			return nil, SonosError.Raise(err, "")
		}
		return JSONStatusOK, nil
	default:
		return nil, MethodNotAllowed.Raise(nil, "Method %s not allowed", req.Method)
	}
}

