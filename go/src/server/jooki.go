package main

import (
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
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


type JookiPlaylist struct {
	ID string `json:"persistent_id"`
	Name string `json:"name"`
	Token *string `json:"token"`
	Tracks []*musicdb.Track `json:"tracks,omitempty"`
}

type sortablePlaylists []*JookiPlaylist
func (s sortablePlaylists) Len() int { return len(s) }
func (s sortablePlaylists) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s sortablePlaylists) Less(i, j int) bool {
	return s[i].Name < s[j].Name
}

func ListJookiPlaylists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
			pl.Tracks[i] = jtr.Track(db)
		}
		pls = append(pls, pl)
	}
	sort.Sort(sortablePlaylists(pls))
	return pls, nil
}

func JookiPlaylistHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		return GetJookiPlaylist(w, req)
	case http.MethodPost:
		return CreateJookiPlaylist(w, req)
	case http.MethodPut:
		return EditJookiPlaylist(w, req)
	case http.MethodPatch:
		return AppendJookiPlaylistTracks(w, req)
	case http.MethodDelete:
		return DeleteJookiPlaylist(w, req)
	default:
		return nil, H.MethodNotAllowed
	}
}

func getJookiPlaylist(lib *jooki.Library, id string) *JookiPlaylist {
	jpl, ok := lib.Playlists[id]
	if !ok {
		return nil
	}
	pl := &JookiPlaylist{
		ID: id,
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
		pl.Tracks[i] = jtr.Track(db)
	}
	return pl
}

func getJookiTrackId(lib *jooki.Library, tr *musicdb.Track) (string, bool, error) {
	if tr.JookiID != nil {
		return *tr.JookiID, true, nil
	}
	if tr.Name == nil || tr.Album == nil || tr.Artist == nil || tr.Size == nil || tr.TotalTime == nil {
		xtr, err := db.GetTrack(tr.PersistentID)
		if err != nil {
			return "", false, err
		}
		if xtr == nil {
			return "", false, H.NotFound.Raise(nil, "track %s does not exist", tr.PersistentID)
		}
		tr = xtr
	}
	jtr := lib.FindTrack(tr)
	if jtr != nil {
		return *jtr.ID, true, nil
	}
	return "", false, nil
}

func uploadJookiTrack(client *jooki.Client, plid string, tr *musicdb.Track) error {
	upload := NewJookiUpload(tr)
	jtr, err := client.UploadToPlaylist(plid, upload)
	if err != nil {
		return err
	}
	tr.JookiID = jtr.ID
	db.SaveTrack(tr)
	return nil
}

func addJookiTracks(client *jooki.Client, plid string, tracks []*musicdb.Track) ([]string, error) {
	ids := []string{}
	lib := client.GetState().Library
	for _, tr := range tracks {
		jookiId, found, err := getJookiTrackId(lib, tr)
		if err != nil {
			return nil, err
		}
		if found {
			_, err := client.AddTrackToPlaylist(plid, jookiId)
			if err != nil {
				return nil, err
			}
			ids = append(ids, jookiId)
		} else {
			err := uploadJookiTrack(client, plid, tr)
			if err != nil {
				return nil, err
			}
			ids = append(ids, *tr.JookiID)
			lib = client.GetState().Library
		}

	}
	return ids, nil
}

func GetJookiPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	plid := path.Base(req.URL.Path)
	pl := getJookiPlaylist(lib, plid)
	if pl == nil {
		return nil, H.NotFound
	}
	return pl, nil
}

func CreateJookiPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
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

func EditJookiPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	plid := path.Base(req.URL.Path)
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
		trackIds := []string{}
		for _, tr := range pl.Tracks {
			jookiId, found, err := getJookiTrackId(lib, tr)
			if err != nil {
				return nil, err
			}
			if found {
				trackIds = append(trackIds, jookiId)
			} else {
				err := uploadJookiTrack(client, plid, tr)
				if err != nil {
					return nil, err
				}
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

func AppendJookiPlaylistTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	lib, err := getJookiLibrary()
	if err != nil {
		return nil, err
	}
	plid := path.Base(req.URL.Path)
	_, ok := lib.Playlists[plid]
	if !ok {
		return nil, H.NotFound
	}
	tracks := []*musicdb.Track{}
	err = H.ReadJSON(req, &tracks)
	if err != nil {
		return nil, err
	}
	_, err = addJookiTracks(client, plid, tracks)
	lib = client.GetState().Library
	pl := getJookiPlaylist(lib, plid)
	if pl == nil {
		return nil, H.NotFound
	}
	return pl, nil
}

func DeleteJookiPlaylist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	_, err := cfg.Auth.Authenticate(w, req)
	if err != nil {
		return nil, err
	}
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	plid := path.Base(req.URL.Path)
	err = client.DeletePlaylist(plid)
	if err != nil {
		return nil, err
	}
	return H.JSONStatusOK, nil
}

func JookiPlay(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	client, err := getJooki(false)
	if err != nil {
		return nil, err
	}
	plid := path.Base(req.URL.Path)
	if plid == "play" {
		return client.Play()
	}
	index, err := strconv.Atoi(plid)
	if err == nil {
		plid = path.Base(path.Dir(req.URL.Path))
	} else {
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
