package api

import (
	"log"
	"net/http"
	"sort"
	"time"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/synos/musicdb"
)

func IndexAPI(router H.Router, authmw H.Middleware) {
	router.GET("/index/genres", authmw(H.HandlerFunc(ListGenres)))
	router.GET("/index/artists", authmw(H.HandlerFunc(ListArtists)))
	router.GET("/index/artists/:artist", authmw(H.HandlerFunc(GetArtist)))
	router.GET("/index/albums", authmw(H.HandlerFunc(ListAlbums)))
	router.GET("/index/albums/:artist/:album", authmw(H.HandlerFunc(GetAlbum)))
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
	cacheFor(w, time.Minute * 15)
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
	cacheFor(w, time.Minute * 15)
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
	cacheFor(w, time.Minute * 15)
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
	cacheFor(w, time.Minute * 15)
	return artists, nil
}

func GetArtist(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	artistName := pathVar(req, "artist")
	artists, err := db.SearchArtists(musicdb.Search{
		LooseArtist: &artistName,
		OwnerID: &user.PersistentID,
	})
	if err != nil {
		return nil, err
	}
	if len(artists) == 0 {
		return nil, H.NotFound
	}
	sort.Slice(artists, func(i, j int) bool {
		return artists[j].Count() < artists[i].Count()
	})
	return artists[0], nil
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
	cacheFor(w, time.Minute * 15)
	return albums, nil
}

func GetAlbum(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	user := getUser(req)
	if user == nil {
		return nil, H.Unauthorized
	}
	artistName := pathVar(req, "artist")
	albumName := pathVar(req, "album")
	albums, err := db.SearchAlbums(musicdb.Search{
		LooseArtist: &artistName,
		LooseAlbum: &albumName,
		OwnerID: &user.PersistentID,
	})
	if err != nil {
		return nil, err
	}
	if len(albums) == 0 {
		return nil, H.NotFound
	}
	return albums[0], nil
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
	cacheFor(w, time.Minute * 15)
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
	cacheFor(w, time.Minute * 15)
	return tracks, nil
}
