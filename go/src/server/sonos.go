package main

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	H "httpserver"
	"musicdb"
	"sonos"
)

var sonosDevice *sonos.Sonos

type SonosEvent struct {
	Type string `json:"type"`
	Event interface{} `json:"event"`
}

func getSonos(quick bool) (*sonos.Sonos, error) {
	if sonosDevice != nil {
		return sonosDevice, nil
	}
	if quick {
		return nil, nil
	}
	iface := cfg.Sonos.GetInterface()
	if iface == nil {
		return nil, errors.New("sonos not configured")
	}
	var err error
	sonosDevice, err = sonos.NewSonos(iface.Name, cfg.Bind.RootURL(cfg.Sonos, false), db)
	if err != nil {
		sonosDevice = nil
		log.Println("error getting sonos:", err)
		return nil, err
	}
	hub, err := getWebsocketHub()
	if err != nil {
		sonosDevice = nil
		return nil, err
	}
	go func() {
		for {
			msg, ok := <-sonosDevice.Events
			if !ok {
				log.Println("sonos channel closed")
				sonosDevice = nil
				break
			}
			hub.BroadcastEvent(&SonosEvent{Type: "sonos", Event: msg})
		}
	}()
	log.Println("sonos ready")
	return sonosDevice, nil
}

func HasSonos(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	return sonosDevice != nil, nil
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
		return nil, H.MethodNotAllowed.Raise(nil, "")
	}
}

func SonosGetQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
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
	err := H.ReadJSON(req, &trackIds)
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
			return nil, H.NotFound.Raise(nil, "Track %s does not exist", id)
		}
		tracks[i] = track
	}
	return tracks, nil
}

func SonosReplaceQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
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
			return nil, H.NotFound.Raise(nil, "playlist %s not found", plid)
		}
		err = dev.ReplaceQueueWithPlaylist(pl)
		if err == nil {
			idx, xerr := strconv.Atoi(req.URL.Query().Get("index"))
			if xerr == nil {
				err = dev.SetQueuePosition(idx)
			}
		}
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
	dev, _ := getSonos(true)
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
			return nil, H.NotFound.Raise(nil, "playlist %s not found", plid)
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
	dev, _ := getSonos(true)
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
			return nil, H.NotFound.Raise(nil, "playlist %s not found", plid)
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
	dev, _ := getSonos(true)
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
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var count int
	err := H.ReadJSON(req, &count)
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
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var ms int
	err := H.ReadJSON(req, &ms)
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
	dev, _ := getSonos(true)
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
	dev, _ := getSonos(true)
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
	dev, _ := getSonos(true)
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
		err = H.ReadJSON(req, &vol)
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
		err = H.ReadJSON(req, &delta)
		if err != nil {
			return nil, err
		}
		err = dev.AlterVolume(delta)
		if err != nil {
			return nil, SonosError.Raise(err, "")
		}
		return JSONStatusOK, nil
	default:
		return nil, H.MethodNotAllowed.Raise(nil, "Method %s not allowed", req.Method)
	}
}

