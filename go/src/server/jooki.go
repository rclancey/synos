package main

import (
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"time"

	H "httpserver"
	"jooki"
	"musicdb"
)

var jookiDevice *jooki.Client

type JookiEvent struct {
	Type string `json:"type"`
	Deltas []*jooki.JookiState `json:"deltas"`
}

func getJooki(quick bool) (*jooki.Client, error) {
	if jookiDevice != nil && !jookiDevice.Closed() {
		return jookiDevice, nil
	}
	if quick {
		return nil, nil
	}
	hub, err := getWebsocketHub()
	if err != nil {
		return nil, err
	}
	jookiDevice, err = jooki.Discover()
	if err != nil {
		log.Println("jooki not available")
		jookiDevice = nil
		return nil, err
	}
	go func() {
		awaiter, err := jookiDevice.AddAwaiter()
		if err != nil {
			log.Println("error getting jooki awaiter:", err)
			jookiDevice.Disconnect()
			jookiDevice = nil
			return
		}
		events := awaiter.GetChannel()
		for {
			msg, ok := <-events
			if !ok {
				log.Println("jooki awaiter shut down")
				awaiter.Close()
				if jookiDevice != nil {
					jookiDevice.Disconnect()
				}
				jookiDevice = nil
				break
			}
			hub.BroadcastEvent(&JookiEvent{Type: "jooki", Deltas: msg.Deltas})
		}
	}()
	log.Println("jooki ready")
	return jookiDevice, nil
}

type JookiUpload struct {
	tr *musicdb.Track
}

func NewJookiUpload(tr *musicdb.Track) *JookiUpload {
	return &JookiUpload{tr: tr}
}

func (up *JookiUpload) ContentType() string {
	return up.tr.ContentType()
}

func (up *JookiUpload) FileName() string {
	return filepath.Base(up.tr.Path())
}

func (up *JookiUpload) Reader() (io.ReadCloser, error) {
	return os.Open(up.tr.Path())
}

func getJookiLibrary() (*jooki.Library, error) {
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
	for state == nil || state.Library == nil {
		update, ok := a.Read(t)
		if !ok {
			a.Close()
			return nil, errors.New("jooki library not available")
		}
		state = update.After
	}
	a.Close()
	return state.Library, nil
}

func GetJookiState(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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

func GetJookiTokens(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	return lib.Tokens, nil
}

type JookiTrack struct {
	ID string `json:"persistent_id"`
	Artist string `json:"artist"`
	Album string `json:"album"`
	Name string `json:"name"`
	Size int `json:"size"`
	TotalTime int `json:"total_time"`
}


func NewJookiTrack(id string, jtr *jooki.Track) *JookiTrack {
	tr := &JookiTrack{ID: id}
	if jtr.Artist != nil {
		tr.Artist = *jtr.Artist
	}
	if jtr.Album != nil {
		tr.Album = *jtr.Album
	}
	if jtr.Name != nil {
		tr.Name = *jtr.Name
	}
	if jtr.Size != nil {
		tr.Size = int(*jtr.Size)
	}
	if jtr.Duration != nil {
		tr.TotalTime = int(*jtr.Duration * 1000)
	}
	return tr
}

type JookiPlaylist struct {
	ID string `json:"persistent_id"`
	Name string `json:"name"`
	Token *string `json:"token"`
	TrackIDs []string `json:"track_ids,omitempty"`
	Tracks []*JookiTrack `json:"tracks,omitempty"`
}

func GetJookiPlaylists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
			Tracks: make([]*JookiTrack, len(jpl.Tracks)),
		}
		for i, trid := range jpl.Tracks {
			jtr, ok := lib.Tracks[trid]
			if !ok {
				continue
			}
			pl.Tracks[i] = NewJookiTrack(trid, jtr)
		}
		pls = append(pls, pl)
	}
	return pls, nil
}

type jookiPlReq struct {
	PlaylistID *musicdb.PersistentID `json:"playlist_id"`
	JookiPlaylistID *string `json:"jooki_playlist_id"`
	Name *string `json:"name"`
	Token *string `json:"token"`
	Tracks *[]*musicdb.Track `json:"tracks"`
	Index *int `json:"index"`
}

func findJookiTrack(lib *jooki.Library, tr *musicdb.Track) *JookiTrack {
	if tr.JookiID != nil {
		jtr, ok := lib.Tracks[*tr.JookiID]
		if ok {
			return NewJookiTrack(*tr.JookiID, jtr)
		}
	}

	for k, jtr := range lib.Tracks {
		if tr.Name == nil || *tr.Name == "" {
			if jtr.Name != nil && *jtr.Name != "" {
				continue
			}
		} else {
			if jtr.Name == nil || *jtr.Name != *tr.Name {
				continue
			}
		}
		if tr.Album == nil || *tr.Album == "" {
			if jtr.Album != nil && *jtr.Album != "" {
				continue
			}
		} else {
			if jtr.Album == nil || *jtr.Album != *tr.Album {
				continue
			}
		}
		if tr.Artist == nil || *tr.Artist == "" {
			if jtr.Artist != nil && *jtr.Artist != "" {
				continue
			}
		} else {
			if jtr.Artist == nil || *jtr.Artist != *tr.Artist {
				continue
			}
		}
		if tr.Size != nil && jtr.Size != nil {
			if int64(*tr.Size) != int64(*jtr.Size) {
				continue
			}
		}
		if tr.TotalTime != nil && jtr.Duration != nil {
			if math.Abs(float64(*tr.TotalTime) - float64(*jtr.Duration) * 1000) > 500 {
				continue
			}
		}
		return NewJookiTrack(k, jtr)
	}
	return nil
}

func CopyPlaylistToJooki(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	cp := &jookiPlReq{}
	err := H.ReadJSON(req, cp)
	if err != nil {
		return nil, err
	}
	var tracks []*musicdb.Track
	var pl *musicdb.Playlist
	if cp.PlaylistID != nil {
		pl, err = db.GetPlaylist(*cp.PlaylistID)
		if err != nil {
			return nil, err
		}
		if pl.Folder {
			return nil, errors.New("Can't copy a playlist folder")
		}
		if pl.Smart != nil {
			tracks, err = db.SmartTracks(pl.Smart)
		} else {
			tracks, err = db.PlaylistTracks(pl)
		}
		if err != nil {
			return nil, err
		}
	} else if cp.Tracks != nil {
		tracks = *cp.Tracks
	} else {
		return nil, H.BadRequest.Raise(nil, "missing playlist source")
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	update := &jooki.PlaylistUpdate{
		Tracks: make([]string, len(tracks)),
	}
	if cp.JookiPlaylistID == nil {
		if pl == nil || pl.JookiID == nil {
			name := "Untitled Playlist"
			if cp.Name != nil {
				name = *cp.Name
			} else if pl != nil {
				name = pl.Name
			}
			jpl, err := client.CreatePlaylist(name)
			if err != nil {
				return nil, err
			}
			update.ID = *jpl.ID
			if pl != nil {
				pl.JookiID = jpl.ID
				db.SavePlaylist(pl)
			}
		} else {
			update.ID = *pl.JookiID
		}
	} else {
		update.ID = *cp.JookiPlaylistID
	}
	for i, tr := range tracks {
		if tr.JookiID != nil {
			update.Tracks[i] = *tr.JookiID
		} else {
			if tr.Name == nil || tr.Album == nil || tr.Artist == nil || tr.Size == nil {
				xtr, err := db.GetTrack(tr.PersistentID)
				if err != nil {
					return nil, err
				}
				if xtr == nil {
					return nil, H.NotFound.Raise(nil, "track %s does not exist", tr.PersistentID)
				}
				tr = xtr
			}
			jtr := findJookiTrack(lib, tr)
			if jtr != nil {
				update.Tracks[i] = jtr.ID
				if tr.JookiID == nil {
					id := jtr.ID
					tr.JookiID = &id
					db.SaveTrack(tr)
				}
			} else {
				upload := NewJookiUpload(tr)
				jtr, err := client.UploadToPlaylist(update.ID, upload)
				if err != nil {
					return nil, err
				}
				update.Tracks[i] = *jtr.ID
				tr.JookiID = jtr.ID
				db.SaveTrack(tr)
				lib = client.GetState().Library
			}
		}
	}
	jpl, err := client.UpdatePlaylist(update)
	if err != nil {
		return nil, err
	}
	lib = client.GetState().Library
	xpl := &JookiPlaylist{
		ID: update.ID,
		Name: jpl.Name,
		Token: jpl.Token,
		TrackIDs: jpl.Tracks,
	}
	xpl.Tracks = make([]*JookiTrack, len(jpl.Tracks))
	for i, trid := range jpl.Tracks {
		jtr, ok := lib.Tracks[trid]
		if !ok {
			continue
		}
		xpl.Tracks[i] = NewJookiTrack(trid, jtr)
	}
	return xpl, nil
}

func PlayJookiPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	cp := &jookiPlReq{}
	err := H.ReadJSON(req, cp)
	if err != nil {
		return nil, err
	}
	var idx int
	if cp.Index == nil {
		idx = 0
	} else {
		idx = *cp.Index
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	if cp.JookiPlaylistID == nil {
		return client.Play()
	}
	return client.PlayPlaylist(*cp.JookiPlaylistID, idx)
}

func JookiSkip(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
		return nil, H.BadRequest.Raise(nil, "jooki not ready")
	}
	np := state.Audio.NowPlaying
	if np.PlaylistID == nil {
		return nil, H.BadRequest.Raise(nil, "no jooki playlist active")
	}
	switch req.Method {
	case http.MethodPost:
		return client.PlayPlaylist(*np.PlaylistID, dir)
	case http.MethodPut:
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
	return nil, H.MethodNotAllowed.Raise(nil, "method %s not allowed", req.Method)
}

func JookiSeek(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
		return nil, H.BadRequest.Raise(nil, "jooki not ready")
	}
	np := state.Audio.NowPlaying
	switch req.Method {
	case http.MethodPost:
		if ms < 0 {
			ms = 0
		} else if np.Duration != nil && float64(ms) > *np.Duration {
			ms = int(*np.Duration)
		}
		return client.Seek(ms)
	case http.MethodPut:
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
	return nil, H.MethodNotAllowed.Raise(nil, "method %s not allowed", req.Method)
}

func RenameJookiPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	cp := &jookiPlReq{}
	err := H.ReadJSON(req, cp)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	if cp.JookiPlaylistID == nil {
		return nil, H.BadRequest.Raise(nil, "no jooki playlist specified")
	}
	if cp.Name == nil {
		return nil, H.BadRequest.Raise(nil, "no playlist name specified")
	}
	jpl, err := client.RenamePlaylist(*cp.JookiPlaylistID, *cp.Name)
	if err != nil {
		return nil, err
	}
	pl := &JookiPlaylist{
		ID: *cp.JookiPlaylistID,
		Name: jpl.Name,
		Token: jpl.Token,
		TrackIDs: jpl.Tracks,
	}
	return pl, nil
}

func SetJookiPlaylistToken(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	cp := &jookiPlReq{}
	err := H.ReadJSON(req, cp)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	if cp.JookiPlaylistID == nil {
		return nil, H.BadRequest.Raise(nil, "no jooki playlist specified")
	}
	if cp.Token == nil {
		return nil, H.BadRequest.Raise(nil, "no token specified")
	}
	jpl, err := client.UpdatePlaylistToken(*cp.JookiPlaylistID, *cp.Token)
	if err != nil {
		return nil, err
	}
	pl := &JookiPlaylist{
		ID: *cp.JookiPlaylistID,
		Name: jpl.Name,
		Token: jpl.Token,
		TrackIDs: jpl.Tracks,
	}
	return pl, nil
}

func JookiPlay(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	return client.Play()
}

func JookiPause(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	return client.Pause()
}

func JookiVolume(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		return GetJookiVolume(w, req)
	case http.MethodPost:
		return SetJookiVolumeTo(w, req)
	case http.MethodPut:
		return ChangeJookiVolumeBy(w, req)
	}
	return nil, H.MethodNotAllowed.Raise(nil, "Method %s not allowed", req.Method)
}

func GetJookiVolume(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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

func SetJookiVolumeTo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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

func ChangeJookiVolumeBy(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var delta int
	err := H.ReadJSON(req, &delta)
	if err != nil {
		return nil, err
	}
	voli, err := GetJookiVolume(w, req)
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

func JookiArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, id := path.Split(path.Clean(req.URL.Path))
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

func JookiPlayMode(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	dev, err := getJooki(false)
	if dev == nil {
		return nil, err
	}
	switch req.Method {
	case http.MethodGet:
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
	case http.MethodPost:
		data, err := ioutil.ReadAll(req.Body)
		if err != nil {
			return nil, err
		}
		mode, err := strconv.Atoi(string(data))
		if err != nil {
			return nil, H.BadRequest.Raise(err, "not a number")
		}
		_, err = dev.SetPlayMode(mode)
		if err != nil {
			return nil, err
		}
		return mode, nil
	default:
		return nil, H.MethodNotAllowed.Raise(nil, "")
	}
}
