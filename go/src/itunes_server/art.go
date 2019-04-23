package main

import (
	"log"
	"net/http"
	"path/filepath"

	"itunes"
)

func ArtistArt(w http.ResponseWriter, req *http.Request) {
	/*
	_, id := path.Split(req.URL.Path)
	if strings.Contains(id, ".") {
		parts := strings.Split(id, ".")
		id = strings.Join(parts[:len(parts)-1], ".")
	}
	tr, ok := lib.Tracks[id]
	if !ok {
		NotFound.Raise(nil, "Track %s does not exist", id).Respond(w)
		return
	}
	fn := tr.Path()
	dn, _ := filepath.Split(fn)
	fn = filepath.Join(dn, "cover.jpg")
	*/
	fn, err := cfg.FileFinder().FindFile("noartist.png")
	log.Println("artist image in", fn, "/", err)
	http.ServeFile(w, req, fn)
}

func AlbumArt(w http.ResponseWriter, req *http.Request) {
	q := req.URL.Query()
	artist := itunes.MakeKey(q.Get("artist"))
	album := itunes.MakeKey(q.Get("album"))
	tracks := lib.SongIndex[itunes.SongKey{artist, album}]
	if tracks == nil || len(tracks) == 0 {
		NotFound.Raise(nil, "No such album").Respond(w)
		return
	}
	finder := cfg.FileFinder()
	for _, tr := range tracks {
		fn := tr.Path()
		dn, _ := filepath.Split(fn)
		fn = filepath.Join(dn, "cover.jpg")
		fn, err := finder.FindFile(fn)
		if err == nil {
			http.ServeFile(w, req, fn)
			return
		}
	}
	fn, _ := finder.FindFile("nocover.png")
	http.ServeFile(w, req, fn)
}
