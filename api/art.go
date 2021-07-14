package api

import (
	"io/ioutil"
	"log"
	"mime"
	"net/http"
	"strings"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/synos/musicdb"
)

func ArtAPI(router H.Router, authmw H.Middleware) {
	router.GET("/art/track/:id", H.HandlerFunc(TrackArt))
	router.PUT("/art/track/:id", authmw(H.HandlerFunc(UpdateArtwork)))
	router.GET("/art/artist", H.HandlerFunc(ArtistArt))
	router.GET("/art/album", H.HandlerFunc(AlbumArt))
	router.GET("/art/genre", H.HandlerFunc(GenreArt))
}

func TrackArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn, err := GetAlbumArtFilename(tr)
	if err != nil {
		return H.Redirect("/assets/nocover.jpg"), nil
	}
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
			return H.StaticFile(fn), nil
		}
		log.Println("error getting artist image from track:", err)
	}
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
		return nil, H.NotFound.Wrap(nil, "No such album")
	}
	for _, tr := range tracks {
		fn, err := GetAlbumArtFilename(tr)
		if err == nil {
			return H.StaticFile(fn), nil
		}
		log.Println("error getting album art:", err)
	}
	return H.Redirect("/assets/nocover.jpg"), nil
}

func GenreArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre := musicdb.MakeSort(q.Get("genre"))
	u, err := GetGenreImageURL(genre)
	if err != nil {
		return nil, H.InternalServerError.Wrap(err, "system error")
	}
	return H.Redirect(u), nil
}
