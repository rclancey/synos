package main

import (
	"net/http"

	"itunes"
)

func HasSonos(w http.ResponseWriter, req *http.Request) {
	SendJSON(w, dev != nil)
}

func SonosQueue(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		SonosGetQueue(w, req)
	case http.MethodPost:
		SonosReplaceQueue(w, req)
	case http.MethodPut:
		SonosAppendQueue(w, req)
	case http.MethodPatch:
		SonosInsertQueue(w, req)
	case http.MethodDelete:
		SonosClearQueue(w, req)
	default:
		MethodNotAllowed.Raise(nil, "").RespondJSON(w)
	}
}

func SonosGetQueue(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	queue, err := dev.GetQueue()
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, queue)
}

func readTracks(req *http.Request) ([]*itunes.Track, *HTTPError) {
	trackIds := []string{}
	err := ReadJSON(req, &trackIds)
	if err != nil {
		return nil, err
	}
	tracks := make([]*itunes.Track, len(trackIds))
	for i, id := range trackIds {
		track, ok := lib.Tracks[id]
		if !ok {
			return nil, NotFound.Raise(nil, "Track %s does not exist", id)
		}
		tracks[i] = track
	}
	return tracks, nil
}

func SonosReplaceQueue(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	var err error
	plid := req.URL.Query().Get("playlist")
	if plid != "" {
		pl, ok := lib.PlaylistIDIndex[plid]
		if !ok {
			NotFound.Raise(nil, "playlist %s not found", plid).RespondJSON(w)
			return
		}
		err = dev.ReplaceQueueWithPlaylist(pl)
	} else {
		tracks, herr := readTracks(req)
		if herr != nil {
			herr.RespondJSON(w)
			return
		}
		err = dev.ReplaceQueue(tracks)
	}
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	err = dev.Play()
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosAppendQueue(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	var err error
	plid := req.URL.Query().Get("playlist")
	if plid != "" {
		pl, ok := lib.PlaylistIDIndex[plid]
		if !ok {
			NotFound.Raise(nil, "playlist %s not found", plid).RespondJSON(w)
			return
		}
		err = dev.AppendPlaylistToQueue(pl)
	} else {
		tracks, herr := readTracks(req)
		if herr != nil {
			herr.RespondJSON(w)
			return
		}
		err = dev.AppendToQueue(tracks)
	}
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosInsertQueue(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	queue, err := dev.GetQueue()
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	plid := req.URL.Query().Get("playlist")
	if plid != "" {
		pl, ok := lib.PlaylistIDIndex[plid]
		if !ok {
			NotFound.Raise(nil, "playlist %s not found", plid).RespondJSON(w)
			return
		}
		err = dev.AppendPlaylistToQueue(pl)
		if queue.Index + 1 < len(queue.Tracks) {
			err = dev.InsertPlaylistIntoQueue(pl, queue.Index+1)
		} else {
			err = dev.AppendPlaylistToQueue(pl)
		}
	} else {
		tracks, herr := readTracks(req)
		if herr != nil {
			herr.RespondJSON(w)
			return
		}
		if queue.Index + 1 < len(queue.Tracks) {
			err = dev.InsertIntoQueue(tracks, queue.Index+1)
		} else {
			err = dev.AppendToQueue(tracks)
		}
	}
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosClearQueue(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	err := dev.ClearQueue()
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosSkip(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	var count int
	herr := ReadJSON(req, &count)
	if herr != nil {
		herr.RespondJSON(w)
		return
	}
	var err error
	if req.Method == http.MethodPost {
		err = dev.SetQueuePosition(count)
	} else {
		err = dev.Skip(count)
	}
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosSeek(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	var ms int
	herr := ReadJSON(req, &ms)
	if herr != nil {
		herr.RespondJSON(w)
		return
	}
	var err error
	if req.Method == http.MethodPut {
		err = dev.Seek(ms)
	} else {
		err = dev.SeekTo(ms)
	}
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosPlay(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	err := dev.Play()
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosPause(w http.ResponseWriter, req *http.Request) {
	if dev == nil {
		ServiceUnavailable.Raise(nil, "Sonos not available").RespondJSON(w)
		return
	}
	err := dev.Pause()
	if err != nil {
		InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
		return
	}
	SendJSON(w, map[string]string{"status": "OK"})
}

func SonosVolume(w http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		vol, err := dev.GetVolume()
		if err != nil {
			InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
			return
		}
		SendJSON(w, vol)
		return
	case http.MethodPost:
		var vol int
		herr := ReadJSON(req, &vol)
		if herr != nil {
			herr.RespondJSON(w)
			return
		}
		err := dev.SetVolume(vol)
		if err != nil {
			InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
			return
		}
		SendJSON(w, map[string]string{"status": "OK"})
		return
	case http.MethodPut:
		var delta int
		herr := ReadJSON(req, &delta)
		if herr != nil {
			herr.RespondJSON(w)
			return
		}
		err := dev.AlterVolume(delta)
		if err != nil {
			InternalServerError.Raise(err, "Error communicating with Sonos").RespondJSON(w)
			return
		}
		SendJSON(w, map[string]string{"status": "OK"})
		return
	default:
		MethodNotAllowed.Raise(nil, "Method %s not allowed", req.Method).RespondJSON(w)
	}
}

