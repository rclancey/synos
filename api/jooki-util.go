package api

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/jooki"
	"github.com/rclancey/synos/musicdb"
)

var jookiDevice *jooki.Client

type JookiEvent struct {
	Type string `json:"type"`
	Deltas []*jooki.JookiState `json:"deltas"`
}

type TrackProgress struct {
	PersistentID musicdb.PersistentID `json:"persistent_id"`
	JookiID *string `json:"jooki_id,omitempty"`
	UploadID *int `json:"upload_id,omitempty"`
	UploadProgress *float64 `json:"upload_progress,omitempty"`
	Error bool `json:"error,omitempty"`
}

type ProgressEvent struct {
	Type string `json:"type"`
	Tracks []TrackProgress `json:"tracks"`
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
	ct := up.tr.ContentType()
	if ct == "audio/mp4a-latm" {
		return "audio/x-m4a"
	}
	return ct
}

func (up *JookiUpload) FileName() string {
	return filepath.Base(up.tr.Path())
}

func (up *JookiUpload) MD5() string {
	h := md5.New()
	r, err := up.Reader()
	if err == nil {
		io.Copy(h, r)
		r.Close()
	}
	return hex.EncodeToString(h.Sum(nil))
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

func findJookiTrackInDB(db *musicdb.DB, jtr *jooki.Track) *musicdb.Track {
	tr := &musicdb.Track{
		JookiID: jtr.ID,
		Artist: jtr.Artist,
		Album: jtr.Album,
		Name: jtr.Name,
		Location: jtr.Location,
	}
	if jtr.Size != nil {
		s := uint64(*jtr.Size)
		tr.Size = &s
	}
	if jtr.Duration != nil {
		tt := uint(*jtr.Duration * 1000)
		tr.TotalTime = &tt
	}
	db.FindTrack(tr)
	if tr.JookiID == nil {
		tr.JookiID = jtr.ID
		db.SaveTrack(tr)
	}
	return tr
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
		pl.Tracks[i] = findJookiTrackInDB(db, jtr)
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
			return "", false, H.NotFound.Wrapf(nil, "track %s does not exist", tr.PersistentID)
		}
		tr = xtr
	}
	jtr := lib.FindTrack(jooki.TrackSearch{
		JookiID: tr.JookiID,
		Name: tr.Name,
		Album: tr.Album,
		Artist: tr.Artist,
		Size: tr.Size,
		TotalTime: tr.TotalTime,
	})
	if jtr != nil {
		return *jtr.ID, true, nil
	}
	return "", false, nil
}

func uploadJookiTrack(client *jooki.Client, plid string, tr *musicdb.Track, ch chan jooki.ProgressUpdate) error {
	upload := NewJookiUpload(tr)
	jtr, err := client.UploadToPlaylist(plid, upload, ch)
	if err != nil {
		log.Println("error uploading track to jooki", err)
		return err
	}
	tr.JookiID = jtr.ID
	db.SaveTrack(tr)
	return nil
}

func addJookiTracks(client *jooki.Client, plid string, tracks []*musicdb.Track) ([]string, error) {
	hub, _ := getWebsocketHub()
	event := ProgressEvent{
		Type: "jooki_progress",
		Tracks: make([]TrackProgress, len(tracks)),
	}
	hub.BroadcastEvent(event)
	ids := []string{}
	lib := client.GetState().Library
	for i, tr := range tracks {
		event.Tracks[i].PersistentID = tr.PersistentID
		jookiId, found, err := getJookiTrackId(lib, tr)
		if err != nil {
			event.Tracks[i].Error = true
			hub.BroadcastEvent(event)
			log.Println("error looking for jooki track")
			return nil, err
		}
		if found {
			event.Tracks[i].JookiID = &jookiId
			hub.BroadcastEvent(event)
			log.Println("track already exists on jooki")
			_, err := client.AddTrackToPlaylist(plid, jookiId)
			if err != nil {
				event.Tracks[i].Error = true
				return nil, err
			}
			p := float64(1)
			event.Tracks[i].UploadProgress = &p
			hub.BroadcastEvent(event)
			ids = append(ids, jookiId)
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
			ids = append(ids, *tr.JookiID)
			lib = client.GetState().Library
		}
	}
	log.Println("tracks added")
	return ids, nil
}
