package api

import (
	"fmt"
	"image"
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/lucasb-eyer/go-colorful"
	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/synos/musicdb"
)

func ArtAPI(router H.Router, authmw H.Middleware) {
	router.GET("/art/track/:id", H.HandlerFunc(TrackArt))
	router.PUT("/art/track/:id", authmw(H.HandlerFunc(UpdateArtwork)))
	router.GET("/art/artist", H.HandlerFunc(ArtistArt))
	router.GET("/art/album", H.HandlerFunc(AlbumArt))
	router.GET("/art/genre", H.HandlerFunc(GenreArt))
	router.GET("art/color/:id", H.HandlerFunc(TrackColor))
}

func TrackArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn, err := GetAlbumArtFilename(tr)
	if err != nil {
		cacheFor(w, time.Minute * 10)
		return H.Redirect("/assets/nocover.jpg"), nil
	}
	cacheFor(w, time.Hour * 48)
	return H.StaticFile(fn), nil
}

func UpdateArtwork(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	ct := strings.Split(req.Header.Get("Content-Type"), ";")[0]
	var ext string
	if ct == "image/jpeg" {
		ext = ".jpg"
	} else if ct == "image/png" {
		ext = ".png"
	} else if ct == "image/gif" {
		ext = ".gif"
	} else {
		exts, err := mime.ExtensionsByType(ct)
		if err != nil && len(exts) > 0 {
			ext = exts[0]
		} else {
			log.Println("no idea what ext to use for mime type", ct)
			ext = ".img"
		}
	}
	img, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return nil, err
	}
	fn, err := db.SaveTrackArtwork(tr, ext, img)
	return fn, err
}

func ArtistArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre  := q.Get("genre")
	artist := q.Get("artist")
	search := musicdb.Search{}
	if genre != "" {
		search.Genre = &genre
	}
	art, err := db.SearchArtist(artist, search)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if len(art.Names) == 0 {
		log.Printf("no tracks for %s / %s\n", genre, artist)
		return nil, H.NotFound.Wrap(nil, "No such artist")
	}
	n := 0
	for _, count := range art.Names {
		n += count
	}
	if n < 5 {
		genres, err := db.ArtistGenres(artist, search)
		if err != nil {
			return nil, DatabaseError.Wrap(err, "")
		}
		cacheFor(w, time.Minute * 10)
		if len(genres) == 0 {
			return nil, H.NotFound.Wrap(err, "no genre for single track artist")
		}
		img, err := GetGenreImageURL(genres[0].SortName)
		if err != nil {
			return nil, H.NotFound.Wrap(err, "no genre image for single track artist")
		}
		return H.Redirect(img), nil
	}
	for _, aname := range art.Sorted() {
		fn, err := GetArtistImageFilename(aname)
		if err == nil {
			cacheFor(w, time.Hour * 48)
			return H.StaticFile(fn), nil
		}
		log.Println("error getting artist image from track:", err)
	}
	cacheFor(w, time.Minute * 10)
	return nil, H.NotFound.Wrap(nil, "no artist image found")
}

func AlbumArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre  := q.Get("genre")
	artist := q.Get("artist")
	album  := q.Get("album")
	search := musicdb.Search{
		AlbumArtist: &artist,
		Album: &album,
	}
	if genre != "" {
		search.Genre = &genre
	}
	tracks, err := db.SearchTracks(search, -1, -1)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	if tracks == nil || len(tracks) == 0 {
		log.Printf("no tracks for genre='%s', artist='%s', album='%s'", genre, artist, album)
		cacheFor(w, time.Minute * 10)
		return nil, H.NotFound.Wrap(nil, "No such album")
	}
	for _, tr := range tracks {
		fn, err := GetAlbumArtFilename(tr)
		if err == nil {
			cacheFor(w, time.Hour * 48)
			return H.StaticFile(fn), nil
		}
		log.Println("error getting album art:", err)
	}
	cacheFor(w, time.Minute * 10)
	return H.Redirect("/assets/nocover.jpg"), nil
}

func GenreArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre := musicdb.MakeSort(q.Get("genre"))
	u, err := GetGenreImageURL(genre)
	if err != nil {
		return nil, H.InternalServerError.Wrap(err, "system error")
	}
	cacheFor(w, time.Hour * 48)
	return H.Redirect(u), nil
}

func TrackColor(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn, err := GetAlbumArtFilename(tr)
	type res struct {
		Hex string `json:"hex,omitempty"`
		RGBA string `json:"rgba,omitempty"`
		HSLA string `json:"hsla,omitempty"`
		Hue int `json:"hue"`
		Saturation int `json:"saturation"`
		Lightness int `json:"lightness"`
		Theme string `json:"theme,omitempty"`
		Dark bool `json:"dark"`
		Status string `json:"status"`
		Error string `json:"error,omitempty"`
	}
	if err != nil {
		return res{Status: "error", Error: err.Error()}, nil
	}
	f, err := os.Open(fn)
	if err != nil {
		return res{Status: "error", Error: err.Error()}, nil
	}
	img, _, err := image.Decode(f)
	if err != nil {
		return res{Status: "error", Error: err.Error()}, nil
	}
	bounds := img.Bounds()
	width := bounds.Max.X - bounds.Min.X
	height := bounds.Max.Y - bounds.Min.Y
	hs := map[float64]int{}
	ls := make([]float64, width * height)
	ss := make([]float64, width * height)
	var h float64
	themes := map[float64]string{
		0: "red",
		25: "orange",
		60: "yellow",
		120: "green",
		165: "seafoam",
		180: "teal",
		210: "slate",
		240: "blue",
		278: "indigo",
		295: "purple",
		320: "fuchsia",
		360: "red",
	}
	hues := []float64{}
	for k := range themes {
		hues = append(hues, k)
	}
	sort.Float64s(hues)
	for y := bounds.Min.Y; y < bounds.Max.Y; y += 1 {
		for x := bounds.Min.X; x < bounds.Max.X; x += 1 {
			i := width * (y - bounds.Min.Y) + (x - bounds.Min.X)
			c, _ := colorful.MakeColor(img.At(x, y))
			h, ss[i], ls[i] = c.Hsl()
			for j := 0; j < len(hues) - 1; j += 1 {
				if h >= hues[j] && h < hues[j+1] {
					if h - hues[j] < hues[j+1] - h {
						h = hues[j]
					} else {
						h = hues[j+1]
					}
					if h >= 360 {
						h = 0
					}
					break
				}
			}
			hs[h] += 1
		}
	}
	hn := 0
	hmode := float64(0)
	for h, n := range hs {
		if n > hn {
			hmode = h
			hn = n
		}
	}
	sort.Float64s(ss)
	sort.Float64s(ls)
	n := len(ls) / 2
	var s, l float64
	var theme string
	if ss[n] < 0.25 {
		s = 0
		hmode = 0
		theme = "grey"
	} else {
		s = 1
		theme = themes[hmode]
	}
	if ls[n] > 0.5 {
		l = 0.6
	} else {
		l = 0.3
	}
	hsl := colorful.Hsl(hmode, s, l)
	r, g, b := hsl.RGB255()
	return res{
		Hex: hsl.Hex(),
		RGBA: fmt.Sprintf("rgba(%d, %d, %d, 1.0)", r, g, b),
		HSLA: fmt.Sprintf("hsla(%d, %d%%, %d%%, 1.0)", int(hmode), int(s * 100), int(l * 100)),
		Hue: int(hmode),
		Saturation: int(s * 100),
		Lightness: int(l * 100),
		Status: "ok",
		Theme: theme,
		Dark: l < 0.5,
	}, nil
}
