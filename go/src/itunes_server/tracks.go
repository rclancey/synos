package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"time"
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
			HTTPError(w, http.StatusBadRequest, fmt.Sprintf("since %s not an int: %s", since_s, err))
			return
		}
		since = time.Unix(since_i / 1000, (since_i % 1000) * 1000000)
	}
	sf := func(i int) bool {
		tr := lib.TrackList[i]
		return !tr.ModDate().Before(since)
	}
	startIndex := sort.Search(len(lib.TrackList), sf)
	n := 0
	if startIndex >= 0 {
		n = len(lib.TrackList) - startIndex
	}
	SendJSON(w, n)
}

func ListTracks(w http.ResponseWriter, req *http.Request) {
	log.Println("getting tracks")
	qs := req.URL.Query()
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
			HTTPError(w, http.StatusBadRequest, fmt.Sprintf("count %s not an int: %s", count_s, err))
			return
		}
	}
	if page_s == "" {
		page = 1
	} else {
		page, err = strconv.Atoi(page_s)
		if err != nil {
			HTTPError(w, http.StatusBadRequest, fmt.Sprintf("page %s not an int: %s", page_s, err))
			return
		}
	}
	if since_s == "" {
		since = time.Date(1970, time.January, 1, 0, 0, 0, 0, time.UTC)
	} else {
		since_i, err := strconv.ParseInt(since_s, 10, 64)
		if err != nil {
			HTTPError(w, http.StatusBadRequest, fmt.Sprintf("since %s not an int: %s", since_s, err))
			return
		}
		since = time.Unix(since_i / 1000, (since_i % 1000) * 1000000)
	}
	log.Printf("get tracks page = %d, count = %d, since = %s\n", page, count, since)
	sf := func(i int) bool {
		tr := lib.TrackList[i]
		return !tr.ModDate().Before(since)
	}
	startIndex := sort.Search(len(lib.TrackList), sf)
	if startIndex < 0 {
		log.Println("no tracks")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	idx := startIndex + ((page - 1) * count)
	if idx >= len(lib.TrackList) {
		log.Println("already got all tracks")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	end := idx + count
	if end > len(lib.TrackList) {
		end = len(lib.TrackList)
	}
	log.Printf("get tracks %d-%d\n", idx, end-1)
	tracks := lib.TrackList[idx:end]
	SendJSON(w, tracks)
}

func GetTrackCover(w http.ResponseWriter, req *http.Request) {
	_, id := path.Split(req.URL.Path)
	tr, ok := lib.Tracks[id]
	if !ok {
		HTTPError(w, http.StatusNotFound, fmt.Sprintf("track %s not found", id))
		return
	}
	fn := tr.Path()
	dn, _ := filepath.Split(fn)
	fn = filepath.Join(dn, "cover.jpg")
	cand := []string{
		fn,
		"/Volumes/music/Music/iTunes/nocover.png",
		"/volume1/music/Music/iTunes/nocover.png",
		filepath.Join(os.Getenv("HOME"), "Music", "iTunes", "nocover.jpg"),
	}
	for _, x := range cand {
		_, err := os.Stat(x)
		if err == nil {
			http.ServeFile(w, req, x)
			return
		}
	}
	http.ServeFile(w, req, fn)
}

func GetTrack(w http.ResponseWriter, req *http.Request) {
	_, id := path.Split(req.URL.Path)
	tr, ok := lib.Tracks[id]
	if !ok {
		HTTPError(w, http.StatusNotFound, fmt.Sprintf("track %s not found", id))
		return
	}
	fn := tr.Path()
	http.ServeFile(w, req, fn)
}
