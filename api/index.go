package main

import (
	"log"
	"net/http"

	H "github.com/rclancey/httpserver"
	"musicdb"
)

func IndexAPI(router H.Router, authmw Middleware) {
	router.GET("/index/genres", H.HandlerFunc(authmw(ListGenres)))
	router.GET("/index/artists", H.HandlerFunc(authmw(ListArtists)))
	router.GET("/index/albums", H.HandlerFunc(authmw(ListAlbums)))
	router.GET("/index/album-artist", H.HandlerFunc(authmw(ListAlbumsByArtist)))
	router.GET("/index/songs", H.HandlerFunc(authmw(ListSongs)))
	router.GET("/search/albums", H.HandlerFunc(authmw(SearchAlbums)))
	router.GET("/search/artists", H.HandlerFunc(authmw(SearchArtists)))
}

func SearchAlbums(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q, _, _, err := constructSearch(req)
	if err != nil {
		return nil, err
	}
	albums, err := db.SearchAlbums(q)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return albums, nil
}

func SearchArtists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q, _, _, err := constructSearch(req)
	if err != nil {
		return nil, err
	}
	artists, err := db.SearchArtists(q)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return artists, nil
}

func ListGenres(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	genres, err := db.Genres()
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return genres, nil
}

func ListArtists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	genre := musicdb.NewGenre(req.URL.Query().Get("genre"))
	artists, err := db.GenreArtists(genre)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return artists, nil
}

func ListAlbums(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	genre  := musicdb.NewGenre(req.URL.Query().Get("genre"))
	artist := musicdb.NewArtist(req.URL.Query().Get("artist"))
	albums, err := db.GetAlbums(artist, genre)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return albums, nil
}

func ListAlbumsByArtist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	albums, err := db.GetAlbums(nil, nil)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return albums, nil
}

func ListSongs(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	q := req.URL.Query()
	genre  := musicdb.NewGenre(q.Get("genre"))
	artist := musicdb.NewArtist(q.Get("artist"))
	album  := musicdb.NewAlbum(q.Get("album"), artist)
	var tracks []*musicdb.Track
	var err error
	if album != nil {
		log.Printf("artist = %s, album = %s", album.Artist.SortName, album.SortName)
		tracks, err = db.AlbumTracks(album)
	} else if artist != nil {
		tracks, err = db.ArtistTracks(artist)
	} else if genre != nil {
		tracks, err = db.GenreTracks(genre)
	} else {
		return nil, H.BadRequest.Wrap(nil, "must include album, artist or genre")
	}
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return tracks, nil
}
