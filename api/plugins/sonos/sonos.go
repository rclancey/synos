package main

import (
	"errors"
	"log"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	H "github.com/rclancey/httpserver"
	"github.com/rclancey/synos/musicdb"
	"github.com/rclancey/synos/sonos"
)

type SonosAPI string
var db *musicdb.DB

func (api SonosAPI) SetupRoutes(router H.router, argDb *musicdb.DB) {
	sub := router.Prefix("/sonos")
	sub.GET("/available", H.HandlerFunc(authmw(HasSonos)))
	sub.GET("/queue", H.HandlerFunc(authmw(SonosGetQueue)))
	sub.POST("/queue", H.HandlerFunc(authmw(SonosReplaceQueue)))
	sub.PUT("/queue", H.HandlerFunc(authmw(SonosAppendQueue)))
	sub.PATCH("/queue", H.HandlerFunc(authmw(SonosInsertQueue)))
	sub.DELETE("/queue", H.HandlerFunc(authmw(SonosClearQueue)))
	sub.POST("/play", H.HandlerFunc(authmw(SonosPlay)))
	sub.POST("/pause", H.HandlerFunc(authmw(SonosPause)))
	sub.POST("/skip", H.HandlerFunc(authmw(SonosSkipTo)))
	sub.PUT("/skip", H.HandlerFunc(authmw(SonosSkipBy)))
	sub.POST("/seek", H.HandlerFunc(authmw(SonosSeekTo)))
	sub.PUT("/seek", H.HandlerFunc(authmw(SonosSeekBy)))
	sub.GET("/volume", H.HandlerFunc(authmw(SonosGetVolume)))
	sub.POST("/volume", H.HandlerFunc(authmw(SonosSetVolumeTo)))
	sub.PUT("/volume", H.HandlerFunc(authmw(SonosChangeVolumeBy)))
	sub.GET("/playmode", H.HandlerFunc(authmw(SonosGetPlayMode)))
	sub.POST("/playmode", H.HandlerFunc(authmw(SonosSetPlayMode)))
	sub.POST("/next", H.HandlerFunc(authmw(SonosNext)))
	sub.POST("/set", H.HandlerFunc(authmw(SonosSetTrack)))
	sub.GET("/actions", H.HandlerFunc(authmw(SonosActions)))
	sub.GET("/queues", H.HandlerFunc(authmw(SonosListQueues)))
	sub.POST("/useQueue", H.HandlerFunc(authmw(SonosUseQueue)))
	sub.GET("/children", H.HandlerFunc(authmw(SonosChildren)))
	sub.GET("/children/:id", H.HandlerFunc(authmw(SonosChildren)))
	sub.GET("/media", H.HandlerFunc(authmw(SonosMedia)))
}

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
		timer := time.NewTimer(time.Minute * 5)
		for {
			select {
			case msg, ok := <-sonosDevice.Events:
				if !ok {
					log.Println("sonos channel closed")
					sonosDevice = nil
					break
				}
				hub.BroadcastEvent(&SonosEvent{Type: "sonos", Event: msg})
				if !timer.Stop() {
					<-timer.C
				}
				timer.Reset(time.Minute * 5)
			case <-timer.C:
				log.Println("reconnecting sonos")
				sonosDevice.Reconnect()
				timer.Reset(time.Minute * 5)
			}
		}
	}()
	log.Println("sonos ready")
	return sonosDevice, nil
}

func HasSonos(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	return sonosDevice != nil, nil
}

func SonosGetPlayMode(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	return dev.GetPlayMode()
}

func SonosSetPlayMode(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	data, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	mode, err := strconv.Atoi(string(data))
	if err != nil {
		return nil, H.BadRequest.Wrap(err, "not a number")
	}
	err = dev.SetPlayMode(mode)
	if err != nil {
		return nil, err
	}
	return mode, nil
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
		return nil, H.MethodNotAllowed.Wrap(nil, "")
	}
}

func SonosGetQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	queue, err := dev.GetQueue()
	if err != nil {
		return nil, SonosError.Wrap(err, "")
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
			return nil, DatabaseError.Wrap(err, "")
		}
		if track == nil {
			return nil, H.NotFound.Wrapf(nil, "Track %s does not exist", id)
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
			log.Println("database error:", err)
			return nil, DatabaseError.Wrap(err, "")
		}
		if pl == nil {
			return nil, H.NotFound.Wrapf(nil, "playlist %s not found", plid)
		}
		err = dev.ReplaceQueueWithPlaylist(pl)
		if err == nil {
			idx, xerr := strconv.Atoi(req.URL.Query().Get("index"))
			if xerr == nil {
				err = dev.SetQueuePosition(idx)
				if err != nil {
					log.Println("error setting queue position:", err)
				}
			}
		} else {
			log.Println("error setting queue to playlist:", err)
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
		return nil, SonosError.Wrap(err, "")
	}
	err = dev.Play()
	if err != nil {
		return nil, SonosError.Wrap(err, "")
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
			return nil, DatabaseError.Wrap(err, "")
		}
		if pl == nil {
			return nil, H.NotFound.Wrapf(nil, "playlist %s not found", plid)
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
		return nil, SonosError.Wrap(err, "")
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
		return nil, SonosError.Wrap(err, "")
	}
	plid := new(musicdb.PersistentID)
	err = plid.Decode(req.URL.Query().Get("playlist"))
	if err == nil && *plid != 0 {
		var pl *musicdb.Playlist
		pl, err = db.GetPlaylist(*plid)
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
		if pl == nil {
			return nil, H.NotFound.Wrapf(nil, "playlist %s not found", plid)
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
		return nil, SonosError.Wrap(err, "")
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
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosSkipTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var count int
	err := H.ReadJSON(req, &count)
	if err != nil {
		return nil, err
	}
	err = dev.SetQueuePosition(count)
	if err != nil {
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosSkipBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var count int
	err := H.ReadJSON(req, &count)
	if err != nil {
		return nil, err
	}
	err = dev.Skip(count)
	if err != nil {
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosSeekTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var ms int
	err := H.ReadJSON(req, &ms)
	if err != nil {
		return nil, err
	}
	err = dev.SeekTo(ms)
	if err != nil {
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosSeekBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	if dev == nil {
		return nil, SonosUnavailableError
	}
	var ms int
	err := H.ReadJSON(req, &ms)
	if err != nil {
		return nil, err
	}
	err = dev.Seek(ms)
	if err != nil {
		return nil, SonosError.Wrap(err, "")
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
		return nil, SonosError.Wrap(err, "")
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
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosGetVolume(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	var err error
	vol, err := dev.GetVolume()
	if err != nil {
		return nil, SonosError.Wrap(err, "")
	}
	return vol, nil
}

func SonosSetVolumeTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	var err error
	var vol int
	err = H.ReadJSON(req, &vol)
	if err != nil {
		return nil, err
	}
	err = dev.SetVolume(vol)
	if err != nil {
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosChangeVolumeBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	var err error
	var delta int
	err = H.ReadJSON(req, &delta)
	if err != nil {
		return nil, err
	}
	err = dev.AlterVolume(delta)
	if err != nil {
		return nil, SonosError.Wrap(err, "")
	}
	return JSONStatusOK, nil
}

func SonosNext(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	err := dev.Next()
	if err != nil {
		return nil, err
	}
	return JSONStatusOK, nil
}

func SonosSetTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	tracks, err := readTracks(req)
	if err != nil {
		return nil, err
	}
	err = dev.SetTrack(tracks[0])
	if err != nil {
		return nil, err
	}
	return JSONStatusOK, nil
}

func SonosActions(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	actions, err := dev.ListActions()
	return actions, err
}

func SonosListQueues(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	queues, err := dev.ListQueues()
	return queues, err
}

func SonosUseQueue(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	items, err := dev.UseQueue("Q:0")
	if err != nil {
		return nil, err
	}
	return items, nil
}

func SonosChildren(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	id := pathVar(req, "id")
	return dev.GetChildren(id)
}

func SonosMedia(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, _ := getSonos(true)
	return dev.GetMediaInfo()
}

