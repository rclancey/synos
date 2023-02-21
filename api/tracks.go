package api

import (
	"bytes"
	"encoding/gob"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/itunes/loader"
	"github.com/rclancey/itunes/persistentId"
	"github.com/rclancey/synos/musicdb"
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

func TrackAPI(router H.Router, authmw H.Middleware) {
	router.GET("/track/:id/info", H.HandlerFunc(GetTrackInfo))
	router.GET("/track/:id/cover", H.HandlerFunc(GetTrackCover))
	router.GET("/track/:id/hascover", H.HandlerFunc(TrackHasCover))
	router.GET("/track/:id/lyrics", H.HandlerFunc(GetTrackLyrics))
	router.PUT("/track/:id/lyrics", H.HandlerFunc(SetTrackLyrics))
	router.GET("/track/:id", H.HandlerFunc(GetTrack))
	router.PUT("/track/:id", authmw(H.HandlerFunc(UpdateTrack)))
	router.POST("/track", authmw(H.HandlerFunc(AddTrack)))
	router.PUT("/track/:id/skip", authmw(H.HandlerFunc(SkipTrack)))
	router.PUT("/track/:id/rate", authmw(H.HandlerFunc(RateTrack)))
	router.GET("/tracks/count", authmw(H.HandlerFunc(TrackCount)))
	router.GET("/tracks/plays", authmw(H.HandlerFunc(PlayCounts)))
	router.GET("/tracks/skips", authmw(H.HandlerFunc(SkipCounts)))
	router.GET("/tracks/search", authmw(H.HandlerFunc(SearchTracks)))
	router.GET("/tracks", authmw(H.HandlerFunc(ListTracks)))
	router.PUT("/tracks", authmw(H.HandlerFunc(UpdateTracks)))
	router.GET("/itunes-track/:id", H.HandlerFunc(GetItunesTrack))
}

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
	return nil, H.MethodNotAllowed
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
	return nil, H.MethodNotAllowed
}

func GetTrackLyrics(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	lyricsPtr, err := tr.GetLyrics()
	if err != nil {
		return nil, err
	}
	if lyricsPtr != nil {
		return tr, nil
	}
	var index int = 0
	indexStr, ok := req.URL.Query()["index"]
	if ok && len(indexStr) > 0 {
		index, err = strconv.Atoi(indexStr[0])
		if err != nil {
			return nil, err
		}
		if index < 0 {
			return nil, H.NotFound
		}
	}
	search, err := azClient.Search(musicdb.LyricsTrack(*tr))
	if err != nil {
		return nil, err
	}
	if index >= len(search.Results) {
		return nil, H.NotFound
	}
	err = azClient.LoadResult(search.Results[index])
	if err != nil {
		return nil, err
	}
	return search, nil
}

func SetTrackLyrics(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	_, err = tr.GetLyrics()
	if err != nil {
		return nil, err
	}
	lyricsBytes, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	err = tr.SetLyrics(string(lyricsBytes))
	if err != nil {
		return nil, err
	}
	return tr, nil
}

func GetItunesTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	qs := `SELECT data FROM itunes_track WHERE id = ?`
	row := db.QueryRow(qs, id.String())
	var data []byte
	err = row.Scan(&data)
	if err != nil {
		return nil, err
	}
	buf := bytes.NewBuffer(data)
	dec := gob.NewDecoder(buf)
	obj := &loader.Track{}
	err = dec.Decode(obj)
	if err != nil {
		return nil, err
	}
	return obj, nil
}

func GetTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn := tr.Path()
	log.Printf("get track %s: %s\n", tr.PersistentID, fn)
	rng := req.Header.Get("Range")
	if rng == "" || strings.HasPrefix(rng, "bytes=0-") {
		user := getUsername(req)
		H.Count("tracks_played", map[string]string{"user": user})
		if tr.Size != nil {
			H.Increment("tracks_played_size", map[string]string{"user": user}, float64(*tr.Size))
		}
		if tr.TotalTime != nil {
			H.Increment("tracks_played_time", map[string]string{"user": user}, float64(*tr.TotalTime))
		}
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
	return H.StaticFile(fn), nil
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
		return H.Redirect("/assets/nocover.jpg"), nil
	}
	return H.StaticFile(fn), nil
}

func AddTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
		return nil, H.BadRequest.Wrapf(nil, "Unknown file type: %s", ct)
	}
	tfn, err := H.CopyToFile(req.Body, pat, false)
	if err != nil {
		return nil, FilesystemError.Wrap(err, "")
	}
	defer os.Remove(tfn)

	track, err := musicdb.TrackFromAudioFile(tfn)
	if err != nil {
		log.Println("error gathering track metadata:", err)
	}
	TrackInfoFromHeader(req, track)

	tf, err := os.Open(tfn)
	if err != nil {
		return nil, FilesystemError.Wrap(err, "")
	}
	savefn := filepath.Join(musicdb.GetGlobalFinder().GetMediaFolder(), track.CanonicalPath())
	outfn, err := H.CopyToFile(tf, savefn, false)
	if err != nil {
		if os.IsExist(err) {
			return nil, H.BadRequest.Wrapf(err, "%s already exists", savefn)
		}
		return nil, FilesystemError.Wrap(err, "")
	}
	track.Location = stringp(musicdb.GetGlobalFinder().Clean(outfn))
	err = db.SaveTrack(track)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return track, nil
}

func UpdateTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	update := map[string]interface{}{}
	err = H.ReadJSON(req, &update)
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
		return nil, DatabaseError.Wrap(err, "")
	}
	hub, err := getWebsocketHub()
	if err == nil {
		evt := &LibraryEvent{
			Type: "library",
			Tracks: tracks,
		}
		hub.BroadcastEvent(evt)
	}
	return tr, nil
}

func SkipTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
		return nil, DatabaseError.Wrap(err, "")
	}
	return tr, nil
}

func RateTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	var rating *uint8
	err = H.ReadJSON(req, &rating)
	if err != nil {
		return nil, err
	}
	tr.Rating = rating
	err = db.SaveTrack(tr)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return tr, nil
}

func DeleteTrack(w http.ResponseWriter, req *http.Request) (interface{}, error) {
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
		Purchased *bool
		DateAdded *musicdb.Time `url:"date_added"`
		Since musicdb.Time
	}
	params.Count = 100
	params.Page = 1
	err := H.QueryScan(req, &params)
	if err != nil {
		return nil, err
	}
	args := map[string]interface{}{}
	if params.Purchased != nil {
		args["purchased"] = *params.Purchased
	}
	if params.DateAdded != nil {
		args["date_added"] = *params.DateAdded
	}
	tracks, err := db.TracksSince(musicdb.Music, params.Since, params.Page - 1, params.Count, args)
	if err != nil {
		log.Println("database error:", err)
		return nil, DatabaseError.Wrap(err, "")
	}
	if len(tracks) == 0 {
		log.Println("no tracks")
		return nil, H.NoContent
	}
	return tracks, nil
}

func getParamAsTime(req *http.Request, key string) (musicdb.Time, error) {
	qs := req.URL.Query()
	since_s := qs.Get(key)
	var since musicdb.Time
	if since_s != "" {
		since_i, err := strconv.ParseInt(since_s, 10, 64)
		if err != nil {
			return since, H.BadRequest.Wrapf(err, "%s param %s not an int", key, since_s)
		}
		since = musicdb.Time(since_i)
	}
	return since, nil
}

func TrackCount(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	since, err := getParamAsTime(req, "since")
	if err != nil {
		return nil, err
	}
	count, err := db.TracksSinceCount(musicdb.Music, since)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return count, nil
}

func PlayCounts(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	since, err := getParamAsTime(req, "since")
	if err != nil {
		return nil, err
	}
	tracks, err := db.PlayCounts(since)
	return tracks, err
}

func SkipCounts(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	since, err := getParamAsTime(req, "since")
	if err != nil {
		return nil, err
	}
	tracks, err := db.SkipCounts(since)
	return tracks, err
}

type MultiTrackUpdate struct {
	TrackIDs []pid.PersistentID `json:"track_ids"`
	Update map[string]interface{} `json:"update"`
}

func UpdateTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	var mtu MultiTrackUpdate
	err := H.ReadJSON(req, &mtu)
	if err != nil {
		return nil, err
	}
	tracks := make([]*musicdb.Track, len(mtu.TrackIDs))
	for i, tid := range mtu.TrackIDs {
		tracks[i], err = db.GetTrack(tid)
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
	}
	err = ApplyTrackUpdates(tracks, mtu.Update)
	if err != nil {
		return nil, err
	}
	err = db.SaveTracks(tracks)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	hub, err := getWebsocketHub()
	if err == nil {
		evt := &LibraryEvent{
			Type: "library",
			Tracks: tracks,
		}
		hub.BroadcastEvent(evt)
	}
	return tracks, nil
}

func getTrackById(req *http.Request) (*musicdb.Track, error) {
	id, err := getPathId(req)
	if err != nil {
		return nil, err
	}
	tr, err := db.GetTrack(id)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if tr == nil {
		log.Printf("track %s does not exist", id)
		return nil, H.NotFound.Wrapf(nil, "Track %s does not exist", id)
	}
	return tr, nil
}

type SearchParams struct {
	Query *string `url:"q" json:"q,omitempty"`
	Genre *string `url:"genre" json:"genre,omitempty"`
	Song *string `url:"song" json:"song,omitempty"`
	Album *string `url:"album" json:"album,omitempty"`
	Artist *string `url:"artist" json:"artist,omitempty"`
	Count *int `url:"count" json:"count,omitempty"`
	Page *int `url:"page" json:"page,omitempty"`
}

type SearchResponse struct {
	Params *musicdb.Search `json:"params"`
	TotalResults int `json:"total_results"`
	ResultsPerPage int `json:"results_per_page"`
	More bool `json:"more"`
	Tracks []*musicdb.Track `json:"tracks"`
}

var searchRe = regexp.MustCompile(`(?:^|\s+)(song:|album:|artist:|genre:|)("[^"]*(?:"|$)|'[^']*(?:'|$)|\S*)`)

func constructSearch(req *http.Request) (musicdb.Search, int, int, error) {
	q := musicdb.Search{}
	search := &SearchParams{}
	err := H.QueryScan(req, search)
	if err != nil {
		return q, -1, -1, H.BadRequest.Wrap(err, "")
	}
	if search.Query != nil && *search.Query != "" {
		ms := searchRe.FindAllStringSubmatch(*search.Query, -1)
		any := []string{}
		for _, m := range ms {
			key := strings.ToLower(strings.TrimSuffix(m[1], `:`))
			val := strings.TrimPrefix(m[2], `"`)
			val = strings.TrimSuffix(val, `"`)
			val = strings.TrimPrefix(val, `'`)
			val = strings.TrimSuffix(val, `'`)
			switch key {
			case "song":
				q.LooseName = &val
			case "album":
				q.LooseAlbum = &val
			case "artist":
				q.LooseArtist = &val
			case "genre":
				q.Genre = &val
			default:
				any = append(any, val)
			}
		}
		if len(any) > 0 {
			any_s := strings.Join(any, " ")
			q.Any = &any_s
		}
	}
	if search.Genre != nil && *search.Genre != "" {
		q.Genre = search.Genre
	}
	if search.Song != nil && *search.Song != "" {
		q.LooseName = search.Song
	}
	if search.Album != nil && *search.Album != "" {
		q.LooseAlbum = search.Album
	}
	if search.Artist != nil && *search.Artist != "" {
		q.LooseArtist = search.Artist
	}
	limit := 100
	offset := 0
	if search.Count != nil && *search.Count > 0 {
		if *search.Count > 1000 {
			limit = 1000
		} else {
			limit = *search.Count
		}
	}
	if search.Page != nil {
		offset = limit * *search.Page
	}
	return q, limit, offset, nil
}

func SearchTracks(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q, limit, offset, err := constructSearch(req)
	if err != nil {
		return nil, err
	}
	n, err := db.SearchTracksCount(q)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	tracks, err := db.SearchTracks(q, limit, offset)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	res := &SearchResponse{
		Params: &q,
		TotalResults: n,
		ResultsPerPage: limit,
		More: offset + len(tracks) < n,
		Tracks: tracks,
	}
	cacheFor(w, time.Minute * 15)
	return res, nil
}

