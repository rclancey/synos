package main

import (
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"itunes"
)

var mimeTypes = map[string]string{
	".mp3": "audio/mpeg",
	".m4a": "audio/mp4a-latm",
	".m4p": "audio/mp4a-latm",
	".m4b": "audio/mp4a-latm",
	".wav": "audio/x-wav",
	".mov": "video/quicktime",
	".mp4": "video/mp4",
}

func TrackCount(w http.ResponseWriter, req *http.Request) {
	qs := req.URL.Query()
	since_s := qs.Get("since")
	var since time.Time
	if since_s == "" {
		since = time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC)
	} else {
		since_i, err := strconv.ParseInt(since_s, 10, 64)
		if err != nil {
			BadRequest.Raise(err, "since param %s not an int", since_s).Respond(w)
			return
		}
		since = time.Unix(since_i / 1000, (since_i % 1000) * 1000000)
	}
	tl := lib.TrackList()
	tl.SortBy("ModDate")
	tracks := *tl
	sf := func(i int) bool {
		tr := tracks[i]
		return !tr.ModDate().Before(since)
	}
	startIndex := sort.Search(len(tracks), sf)
	n := 0
	if startIndex >= 0 {
		n = len(tracks) - startIndex
	}
	SendJSON(w, n)
}

func ListTracks(w http.ResponseWriter, req *http.Request) {
	log.Println("getting tracks")
	qs := req.URL.Query()
	tl := lib.TrackList()
	tl.SortBy("ModDate")
	tracks := *tl
	count_s := qs.Get("count")
	page_s := qs.Get("page")
	since_s := qs.Get("since")
	var err error
	var count int
	var page int
	var since time.Time
	if count_s == "" {
		count = 100
	} else {
		count, err = strconv.Atoi(count_s)
		if err != nil {
			BadRequest.Raise(err, "count param %s not an int", count_s).Respond(w)
			return
		}
	}
	if page_s == "" {
		page = 1
	} else {
		page, err = strconv.Atoi(page_s)
		if err != nil {
			BadRequest.Raise(err, "page param %s not an int", page_s).Respond(w)
			return
		}
	}
	if since_s == "" {
		since = time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC)
	} else {
		since_i, err := strconv.ParseInt(since_s, 10, 64)
		if err != nil {
			BadRequest.Raise(err, "since param %s not an int", since_s).Respond(w)
			return
		}
		since = time.Unix(since_i / 1000, (since_i % 1000) * 1000000)
	}
	log.Printf("get tracks page = %d, count = %d, since = %s\n", page, count, since)
	sf := func(i int) bool {
		tr := tracks[i]
		return !tr.ModDate().Before(since)
	}
	startIndex := sort.Search(len(tracks), sf)
	if startIndex < 0 {
		log.Println("no tracks")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	idx := startIndex + ((page - 1) * count)
	if idx >= len(tracks) {
		log.Println("already got all tracks")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	end := idx + count
	if end > len(tracks) {
		end = len(tracks)
	}
	log.Printf("get tracks %d-%d\n", idx, end-1)
	SendJSON(w, tracks[idx:end])
}

func TrackHasCover(w http.ResponseWriter, req *http.Request) {
	_, id := path.Split(req.URL.Path)
	pid := new(itunes.PersistentID)
	pid.DecodeString(id)
	tr, ok := lib.Tracks[*pid]
	if !ok {
		NotFound.Raise(nil, "Track %s does not exist", id).Respond(w)
		return
	}
	fn := tr.Path()
	dn, _ := filepath.Split(fn)
	fn = filepath.Join(dn, "cover.jpg")
	_, err := os.Stat(fn)
	if err == nil {
		SendJSON(w, true)
		return
	}
	SendJSON(w, false)
}

func GetTrackCover(w http.ResponseWriter, req *http.Request) {
	_, id := path.Split(req.URL.Path)
	if strings.Contains(id, ".") {
		parts := strings.Split(id, ".")
		id = strings.Join(parts[:len(parts)-1], ".")
	}
	pid := new(itunes.PersistentID)
	pid.DecodeString(id)
	tr, ok := lib.Tracks[*pid]
	if !ok {
		NotFound.Raise(nil, "Track %s does not exist", id).Respond(w)
		return
	}
	fn, err := GetAlbumArtFilename(tr)
	if err != nil {
		log.Println("error getting cover art:", err)
		http.Redirect(w, req, "/nocover.jpg", http.StatusFound)
		return
		if fn == "" {
			NotFound.Raise(err, "cover art not available").Respond(w)
			return
		}
	}
	http.ServeFile(w, req, fn)
}

func GetTrack(w http.ResponseWriter, req *http.Request) {
	_, id := path.Split(req.URL.Path)
	if strings.Contains(id, ".") {
		parts := strings.Split(id, ".")
		id = strings.Join(parts[:len(parts)-1], ".")
	}
	pid := new(itunes.PersistentID)
	pid.DecodeString(id)
	tr, ok := lib.Tracks[*pid]
	if !ok {
		NotFound.Raise(nil, "Track %s does not exist", id).Respond(w)
		return
	}
	fn := tr.Path()
	log.Println("serving track", id, fn)
	h := w.Header()
	h.Set("transferMode.dlna.org", "Streaming")
	h.Set("X-XSS-Protection", "1; mode=block")
	h.Set("X-Content-Type-Options", "nosniff")
	http.ServeFile(w, req, fn)
}
