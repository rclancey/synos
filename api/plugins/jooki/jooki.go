package main

import (
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"time"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/jooki"
	"github.com/rclancey/synos/musicdb"
)

func JookiAPI(router H.Router, authmw Middleware) {
	router.GET("/state", H.HandlerFunc(authmw(JookiGetState)))
	router.GET("/tokens", H.HandlerFunc(authmw(JookiListTokens)))
	router.GET("/art/:id", H.HandlerFunc(authmw(JookiArt)))
	router.GET("/playlists", H.HandlerFunc(authmw(JookiListPlaylists)))
	router.GET("/playlist/:id", H.HandlerFunc(authmw(JookiGetPlaylist)))
	router.POST("/playlist", H.HandlerFunc(authmw(JookiCreatePlaylist)))
	router.PUT("/playlist/:id", H.HandlerFunc(authmw(JookiEditPlaylist)))
	router.PATCH("/playlist/:id", H.HandlerFunc(authmw(JookiAppendPlaylistTracks)))
	router.DELETE("/playlist/:id", H.HandlerFunc(authmw(JookiDeletePlaylist)))
	router.POST("/play", H.HandlerFunc(authmw(JookiPlay)))
	router.POST("/play/:id", H.HandlerFunc(authmw(JookiPlay)))
	router.POST("/play/:id/:index", H.HandlerFunc(authmw(JookiPlay)))
	router.POST("/pause", H.HandlerFunc(authmw(JookiPause)))
	router.POST("/skip", H.HandlerFunc(authmw(JookiSkipTo)))
	router.PUT("/skip", H.HandlerFunc(authmw(JookiSkipBy)))
	router.POST("/seek", H.HandlerFunc(authmw(JookiSeekTo)))
	router.PUT("/seek", H.HandlerFunc(authmw(JookiSeekBy)))
	router.GET("/volume", H.HandlerFunc(authmw(JookiGetVolume)))
	router.POST("/volume", H.HandlerFunc(authmw(JookiSetVolumeTo)))
	router.PUT("/volume", H.HandlerFunc(authmw(JookiChangeVolumeBy)))
	router.GET("/playmode", H.HandlerFunc(authmw(JookiGetPlayMode)))
	router.POST("/playmode", H.HandlerFunc(authmw(JookiSetPlayMode)))
}

func JookiGetState(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	client, err := getJooki(true)
	if err != nil {
		return nil, err
	}
	return client.GetState(), nil
}

func JookiListTokens(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	return lib.Tokens, nil
}

func JookiArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	id := pathVar(req, "id")
	client, err := getJooki(true)
	if err != nil || client == nil {
		return H.Redirect("/nocover.jpg"), nil
	}
	u := &url.URL{
		Scheme: "http",
		Host: client.IP(),
		Path: fmt.Sprintf("/artwork/%s.jpg", id),
	}
	c := &http.Client{}
	res, err := c.Get(u.String())
	if err != nil {
		return H.Redirect("/nocover.jpg"), nil
	}
	for k, vs := range res.Header {
		for _, v := range vs {
			w.Header().Add(k, v)
		}
	}
	w.WriteHeader(http.StatusOK)
	io.Copy(w, res.Body)
	return nil, nil
}

func JookiListPlaylists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	pls := []*JookiPlaylist{}
	for plid, jpl := range lib.Playlists {
		pl := &JookiPlaylist{
			ID: plid,
			Name: jpl.Name,
			Token: jpl.Token,
			Tracks: make([]*musicdb.Track, len(jpl.Tracks)),
		}
		for i, trid := range jpl.Tracks {
			jtr, ok := lib.Tracks[trid]
			if !ok {
				continue
			}
			jtr.ID = &trid
			pl.Tracks[i] = findJookiTrackInDB(db, jtr)
		}
		pls = append(pls, pl)
	}
	sort.Sort(sortablePlaylists(pls))
	return pls, nil
}

func JookiGetPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	plid := pathVar(req, "id")
	pl := getJookiPlaylist(lib, plid)
	if pl == nil {
		return nil, H.NotFound
	}
	return pl, nil
}

func JookiCreatePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	pl := &JookiPlaylist{}
	err = H.ReadJSON(req, pl)
	if err != nil {
		return nil, err
	}
	jpl, err := client.CreatePlaylist(pl.Name)
	if err != nil {
		return nil, err
	}
	if pl.Token != nil {
		_, err = client.UpdatePlaylistToken(*jpl.ID, *pl.Token)
		if err != nil {
			return nil, err
		}
	}
	if pl.Tracks != nil && len(pl.Tracks) > 0 {
		_, err = addJookiTracks(client, *jpl.ID, pl.Tracks)
		if err != nil {
			return nil, err
		}
	}
	lib := client.GetState().Library
	pl = getJookiPlaylist(lib, *jpl.ID)
	if pl == nil {
		return nil, H.NotFound
	}
	return pl, nil
}

func JookiEditPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	plid := pathVar(req, "id")
	pl := &JookiPlaylist{}
	err = H.ReadJSON(req, pl)
	if err != nil {
		return nil, err
	}
	update := &jooki.PlaylistUpdate{
		ID: plid,
		Title: &pl.Name,
		Token: pl.Token,
	}
	lib := client.GetState().Library
	if pl.Tracks != nil && len(pl.Tracks) > 0 {
		hub, _ := getWebsocketHub()
		event := ProgressEvent{
			Type: "jooki_progress",
			Tracks: make([]TrackProgress, len(pl.Tracks)),
		}
		hub.BroadcastEvent(event)
		trackIds := []string{}
		for i, tr := range pl.Tracks {
			event.Tracks[i].PersistentID = tr.PersistentID
			hub.BroadcastEvent(event)
			jookiId, found, err := getJookiTrackId(lib, tr)
			if err != nil {
				event.Tracks[i].Error = true
				hub.BroadcastEvent(event)
				return nil, err
			}
			if found {
				event.Tracks[i].JookiID = &jookiId
				p := float64(1)
				event.Tracks[i].UploadProgress = &p
				hub.BroadcastEvent(event)
				trackIds = append(trackIds, jookiId)
			} else {
				ch := make(chan jooki.ProgressUpdate, 100)
				go func(i int) {
					for {
						update, ok := <-ch
						if !ok {
							hub.BroadcastEvent(event)
							break
						}
						event.Tracks[i].UploadID = &(update.UploadID)
						event.Tracks[i].UploadProgress = &(update.UploadProgress)
						if update.Track != nil {
							event.Tracks[i].JookiID = update.Track.ID
						}
						if update.Err != nil {
							event.Tracks[i].Error = true
						}
						hub.BroadcastEvent(event)
					}
				}(i)
				log.Println("uploading track to jooki")
				err := uploadJookiTrack(client, plid, tr, ch)
				if err != nil {
					event.Tracks[i].Error = true
					hub.BroadcastEvent(event)
					return nil, err
				}
				event.Tracks[i].JookiID = tr.JookiID
				hub.BroadcastEvent(event)
				trackIds = append(trackIds, *tr.JookiID)
				lib = client.GetState().Library
			}
		}
		update.Tracks = trackIds
	}
	_, err = client.UpdatePlaylist(update)
	if err != nil {
		return nil, err
	}
	lib = client.GetState().Library
	pl = getJookiPlaylist(lib, plid)
	if pl == nil {
		return nil, H.NotFound
	}
	return pl, nil
}

func JookiAppendPlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		log.Println("error getting jooki client", err)
		return nil, err
	}
	lib, err := getJookiLibrary()
	if err != nil {
		log.Println("error getting jooki library", err)
		return nil, err
	}
	plid := pathVar(req, "id")
	_, ok := lib.Playlists[plid]
	if !ok {
		log.Println("jooki playlist", plid, "not found")
		return nil, H.NotFound
	}
	tracks := []*musicdb.Track{}
	err = H.ReadJSON(req, &tracks)
	if err != nil {
		log.Println("error reading request payload", err)
		return nil, err
	}
	_, err = addJookiTracks(client, plid, tracks)
	if err != nil {
		log.Println("error adding tracks", err)
		return nil, err
	}
	lib = client.GetState().Library
	pl := getJookiPlaylist(lib, plid)
	if pl == nil {
		log.Println("can't find playlist", plid)
		return nil, H.NotFound
	}
	return pl, nil
}

func JookiDeletePlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	plid := pathVar(req, "id")
	err = client.DeletePlaylist(plid)
	if err != nil {
		return nil, err
	}
	return JSONStatusOK, nil
}

func JookiPlay(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	plid := pathVar(req, "id")
	if plid == "" {
		return client.Play()
	}
	index, err := strconv.Atoi(pathVar(req, "index"))
	if err != nil {
		index = 0
	}
	return client.PlayPlaylist(plid, index)
}

func JookiPause(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	return client.Pause()
}

func JookiSkipTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var dir int
	err := H.ReadJSON(req, &dir)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	state := client.GetState()
	if state.Audio == nil || state.Audio.NowPlaying == nil {
		return nil, H.BadRequest.Wrap(nil, "jooki not ready")
	}
	np := state.Audio.NowPlaying
	if np.PlaylistID == nil {
		return nil, H.BadRequest.Wrap(nil, "no jooki playlist active")
	}
	return client.PlayPlaylist(*np.PlaylistID, dir)
}

func JookiSkipBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var dir int
	err := H.ReadJSON(req, &dir)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	state := client.GetState()
	if state.Audio == nil || state.Audio.NowPlaying == nil {
		return nil, H.BadRequest.Wrap(nil, "jooki not ready")
	}
	np := state.Audio.NowPlaying
	if np.PlaylistID == nil {
		return nil, H.BadRequest.Wrap(nil, "no jooki playlist active")
	}
	idx := 0
	if np.TrackIndex != nil {
		idx = *np.TrackIndex
	}
	idx += dir
	if state.Library != nil && state.Library.Playlists != nil {
		pl, ok := state.Library.Playlists[*np.PlaylistID]
		if ok && pl != nil && pl.Tracks != nil {
			idx = idx % len(pl.Tracks)
		}
	}
	return client.PlayPlaylist(*state.Audio.NowPlaying.PlaylistID, idx)
}

func JookiSeekTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var ms int
	err := H.ReadJSON(req, &ms)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	state := client.GetState()
	if state.Audio == nil || state.Audio.NowPlaying == nil {
		return nil, H.BadRequest.Wrap(nil, "jooki not ready")
	}
	np := state.Audio.NowPlaying
	if ms < 0 {
		ms = 0
	} else if np.Duration != nil && float64(ms) > *np.Duration {
		ms = int(*np.Duration)
	}
	return client.Seek(ms)
}

func JookiSeekBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var ms int
	err := H.ReadJSON(req, &ms)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	state := client.GetState()
	if state.Audio == nil || state.Audio.NowPlaying == nil {
		return nil, H.BadRequest.Wrap(nil, "jooki not ready")
	}
	np := state.Audio.NowPlaying
	if state.Audio.Playback != nil {
		ms += state.Audio.Playback.Position
	}
	if ms < 0 {
		ms = 0
	} else if np.Duration != nil && float64(ms) > *np.Duration {
		ms = int(*np.Duration)
	}
	return client.Seek(ms)
}

func JookiGetVolume(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	a, err := client.AddAwaiter()
	if err != nil {
		return nil, err
	}
	state := a.GetState()
	t := time.NewTimer(5 * time.Second)
	for state == nil || state.Audio == nil || state.Audio.Config == nil {
		update, ok := a.Read(t)
		if !ok {
			a.Close()
			return nil, errors.New("jooki volume not available")
		}
		state = update.After
	}
	a.Close()
	return state.Audio.Config.Volume, nil
}

func JookiSetVolumeTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var vol int
	err := H.ReadJSON(req, &vol)
	if err != nil {
		return nil, err
	}
	if vol < 0 {
		vol = 0
	} else if vol > 100 {
		vol = 100
	}
	client, err := getJooki(false)
	audio, err := client.SetVolume(vol)
	if err != nil {
		return nil, err
	}
	return audio.Config.Volume, nil
}

func JookiChangeVolumeBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var delta int
	err := H.ReadJSON(req, &delta)
	if err != nil {
		return nil, err
	}
	voli, err := JookiGetVolume(w, req)
	if err != nil {
		return nil, err
	}
	vol := int(voli.(uint8)) + delta
	if vol < 0 {
		vol = 0
	} else if vol > 100 {
		vol = 100
	}
	client, err := getJooki(false)
	audio, err := client.SetVolume(vol)
	if err != nil {
		return nil, err
	}
	return audio.Config.Volume, nil
}

func JookiGetPlayMode(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, err := getJooki(false)
	if dev == nil {
		return nil, err
	}
	mode := 0
	state := dev.GetState()
	if state.Audio != nil && state.Audio.Config != nil {
		if state.Audio.Config.ShuffleMode {
			mode |= jooki.PlayModeShuffle
		}
		if state.Audio.Config.RepeatMode != jooki.RepeatModeOff {
			mode |= jooki.PlayModeRepeat
		}
	}
	return mode, nil
}

func JookiSetPlayMode(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, err := getJooki(false)
	if dev == nil {
		return nil, err
	}
	data, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	mode, err := strconv.Atoi(string(data))
	if err != nil {
		return nil, H.BadRequest.Wrap(err, "not a number")
	}
	_, err = dev.SetPlayMode(mode)
	if err != nil {
		return nil, err
	}
	return mode, nil
}
