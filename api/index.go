package api

import (
	"log"
	"net/http"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/synos/musicdb"
)

func IndexAPI(router H.Router, authmw H.Middleware) {
	router.GET("/index/genres", authmw(H.HandlerFunc(ListGenres)))
	router.GET("/index/artists", authmw(H.HandlerFunc(ListArtists)))
	router.GET("/index/albums", authmw(H.HandlerFunc(ListAlbums)))
	router.GET("/index/album-artist", authmw(H.HandlerFunc(ListAlbumsByArtist)))
	router.GET("/index/songs", authmw(H.HandlerFunc(ListSongs)))
	router.GET("/search/albums", authmw(H.HandlerFunc(SearchAlbums)))
	router.GET("/search/artists", authmw(H.HandlerFunc(SearchArtists)))
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
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	genres, err := db.Genres(&user.PersistentID)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return genres, nil
}

func ListArtists(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	genre := musicdb.NewGenre(req.URL.Query().Get("genre"))
	artists, err := db.GenreArtists(genre, &user.PersistentID)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return artists, nil
}

func ListAlbums(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	genre  := musicdb.NewGenre(req.URL.Query().Get("genre"))
	artist := musicdb.NewArtist(req.URL.Query().Get("artist"))
	albums, err := db.GetAlbums(artist, genre, &user.PersistentID)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return albums, nil
}

func ListAlbumsByArtist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	albums, err := db.GetAlbums(nil, nil, &user.PersistentID)
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return albums, nil
}

func ListSongs(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	q := req.URL.Query()
	genre  := musicdb.NewGenre(q.Get("genre"))
	artist := musicdb.NewArtist(q.Get("artist"))
	album  := musicdb.NewAlbum(q.Get("album"), artist)
	var tracks []*musicdb.Track
	var err error
	if album != nil {
		log.Printf("artist = %s, album = %s", album.Artist.SortName, album.SortName)
		tracks, err = db.AlbumTracks(album, &user.PersistentID)
	} else if artist != nil {
		tracks, err = db.ArtistTracks(artist, &user.PersistentID)
	} else if genre != nil {
		tracks, err = db.GenreTracks(genre, &user.PersistentID)
	} else {
		return nil, H.BadRequest.Wrap(nil, "must include album, artist or genre")
	}
	if err != nil {
		return nil, DatabaseError.Wrap(err, "")
	}
	return tracks, nil
}
