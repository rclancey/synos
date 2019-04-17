package itunesdb

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	//"net/url"
	"os"
	//"runtime/debug"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"itunes"
)

type songMapKey struct {
	name string
	composer_id int64
}

type ITunesDB struct {
	db *sql.DB
	genreMap map[string]int64
	kindMap map[string]int64
	artistMap map[string]int64
	albumMap map[songMapKey]int64
	songMap map[songMapKey]int64
}

func GetDB() (*ITunesDB, error) {
	connStr := "host=/run/postgresql dbname=itunes sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	return &ITunesDB{
		db: db,
		genreMap: map[string]int64{},
		kindMap: map[string]int64{},
		artistMap: map[string]int64{},
		albumMap: map[songMapKey]int64{},
		songMap: map[songMapKey]int64{},
	}, nil
}

func (db *ITunesDB) GetUsers() ([]string, error) {
	usernames := []string{}
	qs := "SELECT username FROM itunes_user"
	rows, err := db.db.Query(qs)
	if err != nil {
		return usernames, err
	}
	var username string
	for rows.Next() {
		err := rows.Scan(&username)
		if err != nil {
			return usernames, err
		}
		usernames = append(usernames, username)
	}
	return usernames, nil
}

func (db *ITunesDB) Login(username, password string) (*int64, bool) {
	qs := "SELECT id, password FROM itunes_user WHERE username = $1"
	rows, err := db.db.Query(qs, username)
	if err != nil {
		fmt.Println("error connecting to db:", err)
		return nil, false
	}
	if !rows.Next() {
		fmt.Println("no such user:", username)
		return nil, false
	}
	var id int64
	var hashed string
	err = rows.Scan(&id, &hashed)
	if err != nil {
		fmt.Println("error getting hashed password:", err)
		return nil, false
	}
	err = bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
	if err != nil {
		fmt.Println("error comparing hashed password:", err)
		return nil, false
	}
	return &id, true
}

func (db *ITunesDB) GetLibraryTracks(library_persistent_id string) ([]*itunes.Track, error) {
	qs := `
		SELECT
			art.name as artist_name,
			aart.name as album_artist,
			alb.name as album,
			song.name

		FROM
			library lib,
			track_file trf,
			kind k,
			track tr,
			performance perf,
			artist art,
			song,
			artist cart,
			genre g,
			disc,
			album alb,
			artist aart
		WHERE
			lib.persistent_id = $1
			AND trf.library_id = lib.id
			AND trf.kind_id = k.id
			AND trf.track_id = tr.id
			AND tr.performance_id = perf.id
			AND perf.performer_id = art.id
			AND perf.song_id = song.id
			AND song.composer_id = cart.id
			AND perf.genre_id = g.id
			AND tr.disc_id = disc.id
			AND disc.album_id = alb.id
			AND alb.artist_id = aart.id
		ORDER BY
			aart.sort_name,
			alb.sort_name,
			disc.disc_number,
			tr.track_number,
			song.sort_name
		LIMIT 100
	`
	/*

,
			cart.name as composer,
			disc.disc_number,
			alb.disc_count,
			tr.track_number,
			disc.track_count,
			g.name as genre,
			tr.track_length as total_time,
			trf.path,
			trf.size,
			alb.release_date,
			trf.date_added,
			trf.date_modified,
			trf.bit_rate,
			trf.sample_rate,
			trf.rating,
			trf.persistent_id,
			k.name as kind,
			trf.purchased,
			trf.play_count,
			trf.last_played,
			trf.skip_count,
			trf.last_skipped,
			song.sort_name as sort_name,
			art.sort_name as sort_artist,
			aart.sort_name as sort_album_artist,
			cart.sort_name as sort_composer

	*/
	rows, err := db.db.Query(qs, library_persistent_id)
	if err != nil {
		return nil, err
	}
	tracks := []*itunes.Track{}
	for rows.Next() {
		track := &itunes.Track{}
		err = rows.Scan(&track.Artist, &track.AlbumArtist, &track.Album, &track.Name)//, &track.Composer, &track.DiscNumber, &track.DiscCount, &track.TrackNumber, &track.TrackCount, &track.Genre, &track.TotalTime, &track.Location, &track.Size, &track.ReleaseDate, &track.DateAdded, &track.DateModified, &track.BitRate, &track.SampleRate, &track.Rating, &track.PersistentID, &track.Kind, &track.Purchased, &track.PlayCount, &track.PlayDate, &track.SkipCount, &track.SkipDate, &track.SortName, &track.SortArtist, &track.SortAlbumArtist, &track.SortComposer)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, track)
	}
	return tracks, nil
}

func make_sortname(name string) string {
	parts := strings.Fields(strings.ToLower(name))
	if len(parts) > 1 {
		if parts[0] == "the" || parts[0] == "a" || parts[0] == "an" {
			parts = parts[1:]
		}
	}
	if len(parts) == 0 {
		return ""
	}
	parts[len(parts)-1] = strings.TrimSuffix(parts[len(parts)-1], "s")
	return strings.Join(parts, " ")
}

func (db *ITunesDB) insertGenre(name, sort_name *string) (int64, error) {
	if name == nil || *name == "" {
		return -1, errors.New("no genre name specified")
	}
	xname := *name
	var xsort_name string
	if sort_name == nil || *sort_name == "" {
		xsort_name = make_sortname(xname)
	} else {
		xsort_name = *sort_name
	}
	qs := "INSERT INTO genre (name, sort_name) VALUES($1, $2) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, xname, xsort_name).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateGenre(track *itunes.Track) (int64, error) {
	id, err := db.insertGenre(track.Genre, nil)
	if err != nil {
		return id, err
	}
	db.genreMap[*track.Genre] = id
	return id, nil
}

func (db *ITunesDB) GetGenre(track *itunes.Track) (*int64, error) {
	if track.Genre == nil || *track.Genre == "" {
		return nil, nil
	}
	id, ok := db.genreMap[*track.Genre]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM genre WHERE name = $1"
	rows, err := db.db.Query(qs, *track.Genre)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.genreMap[*track.Genre] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateGenre(track *itunes.Track) (*int64, error) {
	if track.Genre == nil || *track.Genre == "" {
		return nil, nil
	}
	idp, err := db.GetGenre(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateGenre(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertKind(name *string) (int64, error) {
	if name == nil || *name == "" {
		return -1, errors.New("no kind name specified")
	}
	xname := *name
	qs := "INSERT INTO kind (name) VALUES($1) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, xname).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateKind(track *itunes.Track) (int64, error) {
	id, err := db.insertKind(track.Kind)
	if err != nil {
		return id, err
	}
	db.kindMap[*track.Kind] = id
	return id, nil
}

func (db *ITunesDB) GetKind(track *itunes.Track) (*int64, error) {
	if track.Kind == nil || *track.Kind == "" {
		return nil, nil
	}
	id, ok := db.kindMap[*track.Kind]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM kind WHERE name = $1"
	rows, err := db.db.Query(qs, *track.Kind)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.kindMap[*track.Kind] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateKind(track *itunes.Track) (*int64, error) {
	if track.Kind == nil || *track.Kind == "" {
		return nil, nil
	}
	idp, err := db.GetKind(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateKind(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertArtist(name, sort_name *string, genre_id *int64) (int64, error) {
	if name == nil || *name == "" {
		//debug.PrintStack()
		return -1, errors.New("no artist name specified")
	}
	xname := *name
	var xsort_name string
	if sort_name == nil || *sort_name == "" {
		xsort_name = make_sortname(xname)
	} else {
		xsort_name = *sort_name
	}
	qs := "INSERT INTO artist (name, sort_name, genre_id) VALUES ($1, $2, $3) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, xname, xsort_name, genre_id).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateArtist(track *itunes.Track) (int64, error) {
	genre_id, err := db.GetOrCreateGenre(track)
	if err != nil {
		return -1, err
	}
	id, err := db.insertArtist(track.Artist, track.SortArtist, genre_id)
	if err != nil {
		return -1, err
	}
	db.artistMap[*track.Artist] = id
	return id, nil
}

func (db *ITunesDB) GetArtist(track *itunes.Track) (*int64, error) {
	if track.Artist == nil || *track.Artist == "" {
		return nil, nil
	}
	id, ok := db.artistMap[*track.Artist]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM artist WHERE name = $1"
	rows, err := db.db.Query(qs, *track.Artist)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.artistMap[*track.Artist] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateArtist(track *itunes.Track) (*int64, error) {
	if track.Artist == nil || *track.Artist == "" {
		return nil, nil
	}
	idp, err := db.GetArtist(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateArtist(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) CreateAlbumArtist(track *itunes.Track) (int64, error) {
	genre_id, err := db.GetOrCreateGenre(track)
	if err != nil {
		return -1, err
	}
	id, err := db.insertArtist(track.AlbumArtist, track.SortAlbumArtist, genre_id)
	if err != nil {
		return -1, err
	}
	db.artistMap[*track.AlbumArtist] = id
	return id, nil
}

func (db *ITunesDB) GetAlbumArtist(track *itunes.Track) (*int64, error) {
	if track.AlbumArtist == nil || *track.AlbumArtist == "" {
		return nil, nil
	}
	id, ok := db.artistMap[*track.AlbumArtist]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM artist WHERE name = $1"
	rows, err := db.db.Query(qs, *track.AlbumArtist)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.artistMap[*track.AlbumArtist] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateAlbumArtist(track *itunes.Track) (*int64, error) {
	if track.AlbumArtist == nil || *track.AlbumArtist == "" {
		return nil, nil
	}
	idp, err := db.GetAlbumArtist(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateAlbumArtist(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) CreateComposer(track *itunes.Track) (int64, error) {
	genre_id, err := db.GetOrCreateGenre(track)
	if err != nil {
		return -1, err
	}
	id, err := db.insertArtist(track.Composer, track.SortComposer, genre_id)
	if err != nil {
		return -1, err
	}
	db.artistMap[*track.Composer] = id
	return id, nil
}

func (db *ITunesDB) GetComposer(track *itunes.Track) (*int64, error) {
	if track.Composer == nil || *track.Composer == "" {
		return nil, nil
	}
	id, ok := db.artistMap[*track.Composer]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM artist WHERE name = $1"
	rows, err := db.db.Query(qs, *track.Composer)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.artistMap[*track.Composer] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateComposer(track *itunes.Track) (*int64, error) {
	if track.Composer == nil || *track.Composer == "" {
		return nil, nil
	}
	idp, err := db.GetComposer(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateComposer(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertAlbum(name, sort_name *string, artist_id, genre_id *int64, release_date *time.Time, disc_count *int, compilation *bool) (int64, error) {
	if name == nil || *name == "" {
		return -1, errors.New("no album name specified")
	}
	xname := *name
	var xsort_name string
	if sort_name == nil || *sort_name == "" {
		xsort_name = make_sortname(xname)
	} else {
		xsort_name = *sort_name
	}
	qs := "INSERT INTO album (name, sort_name, artist_id, genre_id, release_date, disc_count, compilation) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, xname, xsort_name, artist_id, genre_id, release_date, disc_count, compilation).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateAlbum(track *itunes.Track) (int64, error) {
	artist_id, err := db.GetOrCreateAlbumArtist(track)
	/*
	if err != nil {
		return -1, err
	}
	*/
	if artist_id == nil {
		artist_id, err = db.GetOrCreateArtist(track)
		if err != nil {
			return -1, err
		}
	}
	genre_id, err := db.GetOrCreateGenre(track)
	if err != nil {
		return -1, err
	}
	var rel_date *time.Time
	if track.ReleaseDate != nil {
		t := time.Time(*track.ReleaseDate)
		rel_date = &t
	}
	id, err := db.insertAlbum(track.Album, track.SortAlbum, artist_id, genre_id, rel_date, track.DiscCount, track.Compilation)
	if err != nil {
		return -1, err
	}
	var art_id int64
	if artist_id != nil {
		art_id = *artist_id
	} else {
		art_id = -1
	}
	db.albumMap[songMapKey{*track.Album, art_id}] = id
	return id, nil
}

func (db *ITunesDB) GetAlbum(track *itunes.Track) (*int64, error) {
	if track.Album == nil || *track.Album == "" {
		return nil, nil
	}
	artist_id, err := db.GetOrCreateAlbumArtist(track)
	/*
	if err != nil {
		return nil, err
	}
	*/
	if artist_id == nil {
		artist_id, err = db.GetOrCreateArtist(track)
		if err != nil {
			return nil, err
		}
	}
	var art_id int64
	if artist_id != nil {
		art_id = *artist_id
	} else {
		art_id = -1
	}
	id, ok := db.albumMap[songMapKey{*track.Album, art_id}]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM album WHERE name = $1 AND artist_id = $2"
	rows, err := db.db.Query(qs, *track.Album, artist_id)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.albumMap[songMapKey{*track.Album, art_id}] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateAlbum(track *itunes.Track) (*int64, error) {
	if track.Album == nil || *track.Album == "" {
		return nil, nil
	}
	idp, err := db.GetAlbum(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateAlbum(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertSong(name, sort_name *string, composer_id, genre_id *int64) (int64, error) {
	if name == nil || *name == "" {
		return -1, errors.New("no song name specified")
	}
	xname := *name
	var xsort_name string
	if sort_name == nil || *sort_name == "" {
		xsort_name = make_sortname(xname)
	} else {
		xsort_name = *sort_name
	}
	qs := "INSERT INTO song (name, sort_name, composer_id, genre_id) VALUES ($1, $2, $3, $4) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, xname, xsort_name, composer_id, genre_id).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateSong(track *itunes.Track) (int64, error) {
	genre_id, err := db.GetOrCreateGenre(track)
	if err != nil {
		return -1, err
	}
	composer_id, err := db.GetOrCreateComposer(track)
	/*
	if err != nil {
		return -1, err
	}
	*/
	if composer_id == nil {
		composer_id, err = db.GetOrCreateArtist(track)
		if err != nil {
			return -1, err
		}
	}
	id, err := db.insertSong(track.Name, track.SortName, composer_id, genre_id)
	if err != nil {
		return -1, err
	}
	var cmp_id int64
	if composer_id != nil {
		cmp_id = *composer_id
	} else {
		cmp_id = -1
	}
	db.songMap[songMapKey{*track.Name, cmp_id}] = id
	return id, nil
}

func (db *ITunesDB) GetSong(track *itunes.Track) (*int64, error) {
	if track.Name == nil || *track.Name == "" {
		return nil, nil
	}
	var err error
	composer_id, _ := db.GetOrCreateComposer(track)
	/*
	if err != nil {
		return nil, err
	}
	*/
	if composer_id == nil {
		composer_id, err = db.GetOrCreateArtist(track)
		if err != nil {
			return nil, err
		}
	}
	var cmp_id int64
	if composer_id != nil {
		cmp_id = *composer_id
	} else {
		cmp_id = -1
	}
	id, ok := db.songMap[songMapKey{*track.Name, cmp_id}]
	if ok {
		return &id, nil
	}
	qs := "SELECT id FROM song WHERE name = $1 AND composer_id = $2"
	rows, err := db.db.Query(qs, *track.Name, composer_id)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		db.songMap[songMapKey{*track.Name, cmp_id}] = id
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateSong(track *itunes.Track) (*int64, error) {
	idp, err := db.GetSong(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateSong(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertPerformance(song_id, performer_id, genre_id *int64, live, acoustic *bool) (int64, error) {
	qs := "INSERT INTO performance (song_id, performer_id, genre_id, live, acoustic) VALUES($1, $2, $3, $4, $5) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, song_id, performer_id, genre_id, live, acoustic).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func hasWord(str, word string) bool {
	mapper := func(r rune) rune {
		if r < 'a' || r > 'z' {
			return -1
		}
		return r
	}
	words := strings.Fields(strings.ToLower(str))
	for _, w := range words {
		if strings.Map(mapper, w) == word {
			return true
		}
	}
	return false
}

func isLive(track *itunes.Track) bool {
	if track.Name != nil && hasWord(*track.Name, "live") {
		return true
	}
	if track.Album != nil && hasWord(*track.Album, "live") {
		return true
	}
	if track.Comments != nil && hasWord(*track.Comments, "live") {
		return true
	}
	return false
}

func isAcoustic(track *itunes.Track) bool {
	if track.Name != nil {
		if hasWord(*track.Name, "acoustic") {
			return true
		}
		if hasWord(*track.Name, "unplugged") {
			return true
		}
	}
	if track.Album != nil {
		if hasWord(*track.Album, "acoustic") {
			return true
		}
		if hasWord(*track.Album, "unplugged") {
			return true
		}
	}
	if track.Comments != nil {
		if hasWord(*track.Comments, "acoustic") {
			return true
		}
		if hasWord(*track.Comments, "unplugged") {
			return true
		}
	}
	return false
}

func (db *ITunesDB) CreatePerformance(track *itunes.Track) (int64, error) {
	song_id, err := db.GetOrCreateSong(track)
	if err != nil {
		return -1, err
	}
	performer_id, err := db.GetOrCreateArtist(track)
	if err != nil {
		return -1, err
	}
	genre_id, err := db.GetOrCreateGenre(track)
	if err != nil {
		return -1, err
	}
	live := isLive(track)
	acoustic := isAcoustic(track)
	id, err := db.insertPerformance(song_id, performer_id, genre_id, &live, &acoustic)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) GetPerformance(track *itunes.Track) (*int64, error) {
	song_id, err := db.GetOrCreateSong(track)
	if err != nil {
		return nil, err
	}
	performer_id, err := db.GetOrCreateArtist(track)
	if err != nil {
		return nil, err
	}
	live := isLive(track)
	acoustic := isAcoustic(track)
	qs := "SELECT id FROM performance WHERE song_id = $1 AND performer_id = $2 AND live = $3 AND acoustic = $4"
	rows, err := db.db.Query(qs, song_id, performer_id, live, acoustic)
	if err != nil {
		return nil, err
	}
	var id int64
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreatePerformance(track *itunes.Track) (*int64, error) {
	idp, err := db.GetPerformance(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreatePerformance(track)
	if err != nil {
		return nil, err
	}
	return &id, err
}

func (db *ITunesDB) insertDisc(album_id *int64, disc_number, track_count *int) (int64, error) {
	qs := "INSERT INTO disc (album_id, disc_number, track_count) VALUES($1, $2, $3) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, album_id, disc_number, track_count).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateDisc(track *itunes.Track) (int64, error) {
	album_id, err := db.GetOrCreateAlbum(track)
	if err != nil {
		return -1, err
	}
	id, err := db.insertDisc(album_id, track.DiscNumber, track.TrackCount)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) GetDisc(track *itunes.Track) (*int64, error) {
	album_id, err := db.GetOrCreateAlbum(track)
	if err != nil {
		return nil, err
	}
	qs := "SELECT id FROM disc WHERE album_id = $1 AND disc_number = $2"
	rows, err := db.db.Query(qs, album_id, track.DiscNumber)
	if err != nil {
		return nil, err
	}
	var id int64
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateDisc(track *itunes.Track) (*int64, error) {
	idp, err := db.GetDisc(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateDisc(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertTrack(disc_id *int64, track_number, track_length *int, performance_id *int64) (int64, error) {
	qs := "INSERT INTO track (disc_id, track_number, track_length, performance_id) VALUES($1, $2, $3, $4) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, disc_id, track_number, track_length, performance_id).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateTrack(track *itunes.Track) (int64, error) {
	disc_id, err := db.GetOrCreateDisc(track)
	if err != nil {
		return -1, err
	}
	performance_id, err := db.GetOrCreatePerformance(track)
	if err != nil {
		return -1, err
	}
	id, err := db.insertTrack(disc_id, track.TrackNumber, track.TotalTime, performance_id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) GetTrack(track *itunes.Track) (*int64, error) {
	disc_id, err := db.GetOrCreateDisc(track)
	if err != nil {
		return nil, err
	}
	qs := "SELECT id FROM track WHERE disc_id = $1 AND track_number = $2"
	rows, err := db.db.Query(qs, disc_id, track.TrackNumber)
	if err != nil {
		return nil, err
	}
	var id int64
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateTrack(track *itunes.Track) (*int64, error) {
	idp, err := db.GetTrack(track)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateTrack(track)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertTrackFile(library_id *int64, persistent_id *string, track_id *int64, path string, date_added, date_modified time.Time, sample_rate, bit_rate *int, size *int64, purchased *bool, kind_id *int64, play_count, skip_count *int, last_played, last_skipped *time.Time, rating *int) (int64, error) {
	qs := "INSERT INTO track_file (library_id, persistent_id, track_id, path, date_added, date_modified, sample_rate, bit_rate, size, purchased, kind_id, play_count, skip_count, last_played, last_skipped, rating) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, library_id, persistent_id, track_id, path, date_added, date_modified, sample_rate, bit_rate, size, purchased, kind_id, play_count, skip_count, last_played, last_skipped, rating).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateTrackFile(track *itunes.Track, library_id *int64) (int64, error) {
	/*
	u, err := url.Parse(*track.Location)
	if err != nil {
		return -1, err
	}
	path := u.Path
	*/
	path := track.Path()
	path = strings.Replace(path, "/Volumes/MultiMedia/", "/volume1/music/", 1)
	path = strings.Replace(path, "/Users/rclancey/", "/volume1/music/", 1)
	info, err := os.Stat(path)
	if err != nil {
		return -1, err
	}
	var date_added, date_modified time.Time
	if track.DateModified == nil {
		date_modified = info.ModTime()
	} else {
		date_modified = time.Time(*track.DateModified)
	}
	if track.DateAdded == nil {
		date_added = date_modified
	} else {
		date_added = time.Time(*track.DateAdded)
	}
	size := info.Size()
	track_id, err := db.GetOrCreateTrack(track)
	if err != nil {
		return -1, err
	}
	kind_id, err := db.GetOrCreateKind(track)
	if err != nil {
		return -1, err
	}
	var play_date, skip_date *time.Time
	if track.PlayDateUTC != nil {
		t := time.Time(*track.PlayDateUTC)
		play_date = &t
	}
	if track.SkipDate != nil {
		t := time.Time(*track.SkipDate)
		skip_date = &t
	}
	id, err := db.insertTrackFile(library_id, track.PersistentID, track_id, path, date_added, date_modified, track.SampleRate, track.BitRate, &size, track.Purchased, kind_id, track.PlayCount, track.SkipCount, play_date, skip_date, track.Rating)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) GetTrackFile(track *itunes.Track, library_id *int64) (*int64, error) {
	qs := "SELECT id FROM track_file WHERE persistent_id = $1 AND library_id = $2"
	rows, err := db.db.Query(qs, track.PersistentID, library_id)
	if err != nil {
		return nil, err
	}
	var id int64
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateTrackFile(track *itunes.Track, library_id *int64) (*int64, error) {
	idp, err := db.GetTrackFile(track, library_id)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateTrackFile(track, library_id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) insertLibrary(persistent_id *string, owner_id *int64) (int64, error) {
	qs := "INSERT INTO library (persistent_id, owner_id) VALUES($1, $2) RETURNING id"
	var id int64
	err := db.db.QueryRow(qs, persistent_id, owner_id).Scan(&id)
	if err != nil {
		return -1, err
	}
	return id, nil
}

func (db *ITunesDB) CreateLibrary(lib *itunes.Library, owner_id *int64) (int64, error) {
	return db.insertLibrary(lib.LibraryPersistentID, owner_id)
}

func (db *ITunesDB) GetLibrary(lib *itunes.Library, owner_id *int64) (*int64, error) {
	qs := "SELECT id FROM library WHERE persistent_id = $1 AND owner_id = $2"
	rows, err := db.db.Query(qs, lib.LibraryPersistentID, owner_id)
	if err != nil {
		return nil, err
	}
	var id int64
	for rows.Next() {
		err = rows.Scan(&id)
		rows.Close()
		if err != nil {
			return nil, err
		}
		return &id, nil
	}
	return nil, nil
}

func (db *ITunesDB) GetOrCreateLibrary(lib *itunes.Library, owner_id *int64) (*int64, error) {
	idp, err := db.GetLibrary(lib, owner_id)
	if err != nil {
		return nil, err
	}
	if idp != nil {
		return idp, nil
	}
	id, err := db.CreateLibrary(lib, owner_id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func (db *ITunesDB) UpdateLibrary(lib *itunes.Library, owner_id *int64) error {
	lib_id, err := db.GetOrCreateLibrary(lib, owner_id)
	if err != nil {
		return err
	}
	var updt *time.Time
	if lib.Date != nil {
		t := time.Time(*lib.Date)
		updt = &t
	}
	qs := "UPDATE library SET application_version = $1, update_date = $2 WHERE id = $3"
	_, err = db.db.Exec(qs, lib.ApplicationVersion, updt, lib_id)
	if err != nil {
		return err
	}
	for _, track := range lib.Tracks {
		if track.TrackType != nil && *track.TrackType == "URL" {
			continue
		}
		if track.Location == nil || !strings.HasPrefix(*track.Location, "file://") {
			continue
		}
		dump, _ := json.MarshalIndent(track, "", "  ")
		fmt.Println(string(dump))
		_, err := db.GetOrCreateTrackFile(track, lib_id)
		if err != nil {
			fmt.Println(err)
			//return err
		}
		//break
	}
	return nil
}
