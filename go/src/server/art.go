package main

import (
	"log"
	"net/http"

	H "httpserver"
	"musicdb"
)

func TrackArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	tr, err := getTrackById(req)
	if err != nil {
		return nil, err
	}
	fn, err := GetAlbumArtFilename(tr)
	if err != nil {
		return H.Redirect("/nocover.jpg"), nil
	}
	return H.StaticFile(fn), nil
}

func ArtistArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre  := q.Get("genre")
	artist := musicdb.MakeSortArtist(q.Get("artist"))
	search := musicdb.Search{}
	if genre != "" {
		search.Genre = &genre
	}
	art, err := db.SearchArtist(artist, search)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if len(art.Names) == 0 {
		log.Printf("no tracks for %s / %s\n", genre, artist)
		return nil, H.NotFound.Raise(nil, "No such artist")
	}
	n := 0
	for _, count := range art.Names {
		n += count
	}
	if n < 5 {
		genres, err := db.ArtistGenres(artist, search)
		if err != nil {
			return nil, DatabaseError.Raise(err, "")
		}
		img, err := GetGenreImageURL(genres[0].SortName)
		if err != nil {
			return nil, H.NotFound.Raise(err, "no genre for single track artist")
		}
		return H.Redirect(img), nil
	}
	for aname := range art.Names {
		fn, err := GetArtistImageFilename(aname)
		if err == nil {
			return H.StaticFile(fn), nil
		}
		log.Println("error getting artist image from track:", err)
	}
	return nil, H.NotFound.Raise(nil, "no artist image found")
}

func AlbumArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre  := musicdb.MakeSort(q.Get("genre"))
	artist := musicdb.MakeSortArtist(q.Get("artist"))
	album  := musicdb.MakeSort(q.Get("album"))
	search := musicdb.Search{
		AlbumArtist: &artist,
		Album: &album,
	}
	if genre != "" {
		search.Genre = &genre
	}
	tracks, err := db.SearchTracks(search)
	if err != nil {
		return nil, DatabaseError.Raise(err, "")
	}
	if tracks == nil || len(tracks) == 0 {
		log.Printf("no tracks for genre='%s', artist='%s', album='%s'", genre, artist, album)
		return nil, H.NotFound.Raise(nil, "No such album")
	}
	for _, tr := range tracks {
		fn, err := GetAlbumArtFilename(tr)
		if err == nil {
			return H.StaticFile(fn), nil
		}
		log.Println("error getting album art:", err)
	}
	return H.Redirect("/nocover.jpg"), nil
}

func GenreArt(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre := musicdb.MakeSort(q.Get("genre"))
	u, err := GetGenreImageURL(genre)
	if err != nil {
		return nil, H.InternalServerError.Raise(err, "system error")
	}
	return H.Redirect(u), nil
}
