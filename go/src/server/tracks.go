package main

import (
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"musicdb"
)

/*
var mimeTypes = map[string]string{
	".mp3": "audio/mpeg",
	".m4a": "audio/mp4a-latm",
	".m4p": "audio/mp4a-latm",
	".m4b": "audio/mp4a-latm",
	".wav": "audio/x-wav",
	".mov": "video/quicktime",
	".mp4": "video/mp4",
}
*/

func TrackHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		_, action := path.Split(req.URL.Path)
		switch action {
		case "info":
			return GetTrackInfo(w, req)
		case "cover":
			return GetTrackCover(w, req)
		case "hascover":
			return TrackHasCover(w, req)
		default:
			return GetTrack(w, req)
		}
	case http.MethodPost:
		return AddTrack(w, req)
	case http.MethodPut:
		_, action := path.Split(req.URL.Path)
		switch action {
		case "skip":
			return SkipTrack(w, req)
		case "rate":
			return RateTrack(w, req)
		default:
			return UpdateTrack(w, req)
		}
	case http.MethodDelete:
		return DeleteTrack(w, req)
	}
	return nil, MethodNotAllowed
}

func TracksHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	switch req.Method {
	case http.MethodGet:
		_, action := path.Split(req.URL.Path)
		switch action {
		case "count":
			return TrackCount(w, req)
		default:
			return ListTracks(w, req)
		}
	case http.MethodPut:
		return UpdateTracks(w, req)
	}
	return nil, MethodNotAllowed
}

func GetTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn := tr.Path()
	rng := req.Header.Get("Range")
	if rng == "" || strings.HasPrefix(rng, "bytes=0-") {
		tr.PlayCount += 1
		if tr.PlayDate == nil {
			tr.PlayDate = new(musicdb.Time)
		}
		tr.PlayDate.Set(time.Now().In(time.UTC))
		db.SaveTrack(tr)
	}
	h := w.Header()
	h.Set("transferMode.dlna.org", "Streaming")
	h.Set("X-XSS-Protection", "1; mode=block")
	h.Set("X-Content-Type-Options", "nosniff")
	return StaticFile(fn), nil
}

func GetTrackInfo(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	return getTrackById(req)
}

func TrackHasCover(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	_, err = GetAlbumArtFilename(tr)
	return err == nil, nil
}

func GetTrackCover(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn, err := GetAlbumArtFilename(tr)
	if err != nil {
		log.Println("error getting cover art:", err)
		return Redirect("/nocover.jpg"), nil
	}
	return StaticFile(fn), nil
}

func AddTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, err
	}
	var pat string
	ct := req.Header.Get("Content-Type")
	switch ct {
	case "audio/mpeg":
		pat = "*.mp3"
	case "audio/x-m4a", "audio/mp4a-latm", "audio/mp4", "audio/aac":
		pat = "*.m4a"
	case "audio/ogg":
		pat = "*.ogg"
	case "audio/x-wav":
		pat = "*.wav"
	case "audio/x-flac":
		pat = "*.flac"
	case "audio/webm":
		pat = "*.weba"
	default:
		return nil, BadRequest.Raise(nil, "Unknown file type: %s", ct)
	}
	tfn, err := CopyToFile(req.Body, pat, false)
	if err != nil {
		return nil, FilesystemError.Raise(err, "")
	}
	defer os.Remove(tfn)

	track, err := musicdb.TrackFromAudioFile(tfn)
	if err != nil {
		log.Println("error gathering track metadata:", err)
	}
	TrackInfoFromHeader(req, track)

	tf, err := os.Open(tfn)
	if err != nil {
		return nil, FilesystemError.Raise(err, "")
	}
	savefn := filepath.Join(musicdb.GetGlobalFinder().GetMediaFolder(), track.CanonicalPath())
	outfn, err := CopyToFile(tf, savefn, false)
	if err != nil {
		if os.IsExist(err) {
			return nil, BadRequest.Raise(err, "%s already exists", savefn)
		}
		return nil, FilesystemError.Raise(err, "")
	}
	track.Location = stringp(musicdb.GetGlobalFinder().Clean(outfn))
	err = db.SaveTrack(track)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return track, nil
}

func UpdateTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, err
	}
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	update := map[string]interface{}{}
	err = ReadJSON(req, &update)
	if err != nil {
		return nil, err
	}
	tracks := []*musicdb.Track{tr}
	err = ApplyTrackUpdates(tracks, update)
	if err != nil {
		return nil, err
	}
	err = db.SaveTrack(tr)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return tr, nil
}

func SkipTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, err
	}
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	tr.SkipCount += 1
	if tr.SkipDate == nil {
		tr.SkipDate = new(musicdb.Time)
	}
	tr.SkipDate.Set(time.Now().In(time.UTC))
	err = db.SaveTrack(tr)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return tr, nil
}

func RateTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, err
	}
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	var rating *uint8
	err = ReadJSON(req, &rating)
	if err != nil {
		return nil, err
	}
	tr.Rating = rating
	err = db.SaveTrack(tr)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return tr, nil
}

func DeleteTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, err
	}
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	err = db.DeleteTrack(tr)
	if err != nil {
		return nil, err
	}
	return true, nil
}

func ListTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var params struct {
		Count int
		Page int
		Since musicdb.Time
	}
	params.Count = 100
	params.Page = 1
	err := QueryScan(req, &params)
	if err != nil {
		return nil, err
	}
	tracks, err := db.TracksSince(params.Since, params.Page - 1, params.Count)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if len(tracks) == 0 {
		return nil, NoContent
	}
	return tracks, nil
}

func TrackCount(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	qs := req.URL.Query()
	since_s := qs.Get("since")
	var since musicdb.Time
	if since_s != "" {
		since_i, err := strconv.ParseInt(since_s, 10, 64)
		if err != nil {
			return nil, BadRequest.Raise(err, "since param %s not an int", since_s)
		}
		since = musicdb.Time(since_i)
	}
	count, err := db.TracksSinceCount(since)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return count, nil
}

type MultiTrackUpdate struct {
	TrackIDs []musicdb.PersistentID
	Update map[string]interface{}
}

func UpdateTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	err := CheckAuth(w, req)
	if err != nil {
		return nil, err
	}
	var mtu MultiTrackUpdate
	err = ReadJSON(req, &mtu)
	if err != nil {
		return nil, err
	}
	tracks := make([]*musicdb.Track, len(mtu.TrackIDs))
	for i, tid := range mtu.TrackIDs {
		tracks[i], err = db.GetTrack(tid)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
	}
	err = ApplyTrackUpdates(tracks, mtu.Update)
	if err != nil {
		return nil, err
	}
	err = db.SaveTracks(tracks)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	return tracks, nil
}

func getTrackById(req *http.Request) (*musicdb.Track, error) {
	pid, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	tr, err := db.GetTrack(pid)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if tr == nil {
		log.Printf("track %s does not exist", pid)
		return nil, NotFound.Raise(nil, "Track %s does not exist", pid)
	}
	return tr, nil
}

