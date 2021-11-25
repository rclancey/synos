package musicdb

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/gob"
	//"encoding/json"
	builtinErrors "errors"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"math/rand"
	"mime"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"

	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/itunes/loader"
	"github.com/rclancey/itunes/persistentId"
	"github.com/rclancey/spotify"
)

var CircularPlaylistFolder = builtinErrors.New("playlist can't be a descendant of itself")
var NoSuchPlaylistFolder = builtinErrors.New("playlist folder does not exist")
var ParentNotAFolder = builtinErrors.New("parent playlist is not a folder")
var PlaylistFolderNotEmpty = builtinErrors.New("Playlist folder not empty")
var ErrUnknownSocialDriver = builtinErrors.New("unknown social login provider")

func serializeGob(obj interface{}) []byte {
	var buf bytes.Buffer
	enc := gob.NewEncoder(&buf)
	enc.Encode(obj)
	return buf.Bytes()
}

func deserializeGob(data []byte, obj interface{}) error {
	buf := bytes.NewBuffer(data)
	dec := gob.NewDecoder(buf)
	return errors.Wrap(dec.Decode(obj), "can't decode gob")
}

type DB struct {
	conn *sqlx.DB
	userChan chan *User
}

func Open(connstr string) (*DB, error) {
	conn, err := sqlx.Connect("postgres", connstr)
	if err != nil {
		return nil, errors.Wrap(err, "can't connect to postgres with " + connstr)
	}
	return &DB{ conn: conn }, nil
}

func (db *DB) Close() error {
	return db.conn.Close()
}

type Search struct {
	Genre *string
	Artist *string
	AlbumArtist *string
	Composer *string
	LooseArtist *string
	Album *string
	LooseAlbum *string
	Name *string
	LooseName *string
	Any *string
	OwnerID *pid.PersistentID
}

func searchSort(field, val string) (string, []interface{}) {
	qs := fmt.Sprintf("(%s = ? OR sort_%s = ?)", field, field)
	vals := []interface{}{val, MakeSort(val)}
	return qs, vals
}

func searchLoose(field, val string) (string, []interface{}) {
	qs := fmt.Sprintf("(%s ILIKE ? OR sort_%s ILIKE ?)", field, field)
	vals := []interface{}{
		"%" + strings.TrimPrefix(strings.TrimSuffix(strings.ReplaceAll(val, "*", "%"), "%"), "%") + "%",
		"%" + strings.TrimPrefix(strings.TrimSuffix(strings.ReplaceAll(MakeSort(val), "*", "%"), "%"), "%") + "%",
	}
	return qs, vals
}

func searchFilters(s Search) (string, []interface{}) {
	filters := []string{}
	vals := []interface{}{}
	if s.Genre != nil {
		qs, vs := searchSort("genre", *s.Genre)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.Artist != nil {
		qs, vs := searchSort("artist", *s.Artist)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.AlbumArtist != nil {
		qs, vs := searchSort("album_artist", *s.AlbumArtist)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.Composer != nil {
		qs, vs := searchSort("composer", *s.Composer)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.LooseArtist != nil {
		any := []string{}
		for _, field := range []string{"artist", "album_artist", "composer"} {
			qs, vs := searchLoose(field, *s.LooseArtist)
			any = append(any, qs)
			vals = append(vals, vs...)
		}
		filters = append(filters, "(" + strings.Join(any, " OR ") + ")")
	}
	if s.Album != nil {
		qs, vs := searchSort("album", *s.Album)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.LooseAlbum != nil {
		qs, vs := searchLoose("album", *s.LooseAlbum)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.Name != nil {
		qs, vs := searchSort("name", *s.Name)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.LooseName != nil {
		qs, vs := searchLoose("name", *s.LooseName)
		filters = append(filters, qs)
		vals = append(vals, vs...)
	}
	if s.Any != nil {
		qs := `to_tsvector(coalesce(name, '') || ' ' || coalesce(artist, '') || ' ' || coalesce(album_artist, '') || ' ' || coalesce(album, '') || ' ' || coalesce(composer, '')) @@ to_tsquery(?)`
		filters = append(filters, qs)
		words := strings.Fields(*s.Any)
		vals = append(vals, strings.Join(words, " & "))
		/*
		any := []string{}
		for _, field := range []string{"artist", "album_artist", "composer", "album", "name"} {
			qs, vs := searchLoose(field, *s.Any)
			any = append(any, qs)
			vals = append(vals, vs...)
		}
		filters = append(filters, "(" + strings.Join(any, " OR ") + ")")
		*/
	}
	if s.OwnerID != nil {
		filters = append(filters, `owner_id = ?`)
		vals = append(vals, *s.OwnerID)
	}
	return strings.Join(filters, " AND "), vals
}

func (db *DB) SearchTracksCount(s Search) (int, error) {
	filters, vals := searchFilters(s)
	if len(filters) == 0 {
		return -1, errors.New("no search params")
	}
	qs := `SELECT COUNT(*) FROM track WHERE ` + filters
	row := db.QueryRow(qs, vals...)
	var n int
	err := row.Scan(&n)
	if err != nil {
		return -1, err
	}
	return n, nil
}

func (db *DB) SearchTracks(s Search, limit int, offset int) ([]*Track, error) {
	filters, vals := searchFilters(s)
	if len(filters) == 0 {
		return nil, errors.New("no search params")
	}
	qs := `SELECT track.*, xuser.homedir FROM track, xuser WHERE track.owner_id = xuser.id AND ` + filters + ` ORDER BY COALESCE(rating, 1) * COALESCE(play_count, 1) / EXTRACT(EPOCH FROM AGE(COALESCE(track.date_added, '1970-01-01 00:00:00Z'))) DESC, sort_album_artist, sort_album, disc_number, track_number, sort_name`;
	if limit > 0 {
		qs += ` LIMIT ?`
		vals = append(vals, limit)
		if offset > 0 {
			qs += ` OFFSET ?`
			vals = append(vals, offset)
		}
	}
	log.Println(qs, vals)
	rows, err := db.Query(qs, vals...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var track Track
		err = rows.StructScan(&track)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into track")
		}
		track.db = db
		tracks = append(tracks, &track)
	}
	return tracks, nil
}


func (db *DB) SearchArtists(s Search) ([]*Artist, error) {
	filters, vals := searchFilters(s)
	if len(filters) == 0 {
		return nil, errors.New("no search params")
	}
	return db.searchArtists(filters, vals)
}

func (db *DB) SearchAlbums(s Search) ([]*Album, error) {
	filters, vals := searchFilters(s)
	if len(filters) == 0 {
		return nil, errors.New("no search params")
	}
	return db.searchAlbums(filters, vals)
}

func (db *DB) RecentTracks(user *User, since Time) ([]*Track, error) {
	qs := `SELECT * FROM track WHERE date_added >= ?`
	args := []interface{}{since}
	if user != nil {
		qs += ` AND owner_id = ?`
		args = append(args, user.PersistentID)
	}
	qs += ` ORDER BY date_added DESC`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var t Track
		err = rows.StructScan(&t)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into track")
		}
		t.db = db
		tracks = append(tracks, &t)
	}
	return tracks, nil
}

func (db *DB) RecentPlaylists(user *User, since Time) ([]*Playlist, error) {
	qs := `SELECT * FROM playlist WHERE (folder IS NULL OR folder = ?) AND date_added >= ?`
	args := []interface{}{false, since}
	if user == nil {
		qs += ` AND shared = 't'`
	} else {
		qs += ` AND (shared = 't' OR owner_id = ?)`
		args = append(args, user.PersistentID)
	}
	qs += ` ORDER BY date_added DESC`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	playlists := []*Playlist{}
	for rows.Next() {
		var pl Playlist
		err = rows.StructScan(&pl)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into playlist")
		}
		pl.db = db
		playlists = append(playlists, &pl)
	}
	return playlists, nil
}

func (db *DB) TracksSinceCount(mk MediaKind, t Time) (int, error) {
	qs := `SELECT COUNT(*) FROM track WHERE media_kind = ? AND date_modified >= ?`
	row := db.QueryRow(qs, mk, t)
	var i int
	err := row.Scan(&i)
	if err != nil {
		return -1, err
	}
	return i, nil
}

func (db *DB) TracksSince(mk MediaKind, t Time, page, count int, args map[string]interface{}) ([]*Track, error) {
	qs := `SELECT * FROM track WHERE media_kind = ? AND date_modified >= ? `
	params := []interface{}{mk, t}
	for k, v := range args {
		if strings.Contains(k, "date") {
			qs += fmt.Sprintf(`AND %s >= ? `, k)
		} else {
			qs += fmt.Sprintf(`AND %s = ? `, k)
		}
		params = append(params, v)
	}
	qs += `ORDER BY id`
	if count > 0 {
		qs += fmt.Sprintf(` LIMIT %d OFFSET %d`, count, page * count)
	}
	log.Println(qs, params)
	rows, err := db.Query(qs, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var t Track
		err = rows.StructScan(&t)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into track")
		}
		t.db = db
		tracks = append(tracks, &t)
	}
	return tracks, nil
}

func (db *DB) Tracks(page, count int, order []string) ([]*Track, error) {
	qs := `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id ORDER BY`
	if len(order) == 0 {
		qs += " date_modified"
	} else {
		cleaned := make([]string, len(order))
		for i, s := range order {
			cleaned[i] = pq.QuoteIdentifier(s)
		}
		qs += strings.Join(cleaned, ",")
	}
	if count > 0 {
		qs += fmt.Sprintf(" LIMIT %d OFFSET %d", count, page * count)
	}
	rows, err := db.Query(qs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var t Track
		err = rows.StructScan(&t)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into track")
		}
		t.db = db
		tracks = append(tracks, &t)
	}
	return tracks, nil
}

func (db *DB) GetTrack(p pid.PersistentID) (*Track, error) {
	qs := `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE track.id = ?`
	row := db.QueryRow(qs, p)
	var track Track
	err := row.StructScan(&track)
	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil
		}
		return nil, errors.Wrap(err, "can't query track " + p.String())
	}
	return &track, nil
}

func (db *DB) GetPlaylist(p pid.PersistentID, user *User) (*Playlist, error) {
	qs := `SELECT * FROM playlist WHERE id = ?`
	args := []interface{}{p}
	if user == nil {
		qs += ` AND shared = 't'`
	} else {
		qs += ` AND (owner_id = ? OR shared = 't')`
		args = append(args, user.PersistentID)
	}
	//log.Println("GetPlaylist:", qs, args)
	row := db.QueryRow(qs, args...)
	var pl Playlist
	err := row.StructScan(&pl)
	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			return nil, nil
		}
		return nil, errors.Wrap(err, "can't query playlist " + p.String())
	}
	return &pl, nil
}

func (db *DB) GetPlaylistTree(root *pid.PersistentID, user *User) ([]*Playlist, error) {
	qs := `SELECT * FROM playlist`
	args := []interface{}{}
	var me pid.PersistentID
	if user == nil {
		qs += ` WHERE shared = 't'`
		me = pid.PersistentID(0)
	} else {
		qs += ` WHERE owner_id = ? OR shared = 't'`
		args = append(args, user.PersistentID)
		me = user.PersistentID
	}
	qs += ` ORDER BY kind, name`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	plm := map[pid.PersistentID]*Playlist{}
	pls := []*Playlist{}
	for rows.Next() {
		var pl Playlist
		err = rows.StructScan(&pl)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into playlist")
		}
		plm[pl.PersistentID] = &pl
		pls = append(pls, &pl)
	}
	top := []*Playlist{}
	shared := map[pid.PersistentID][]*Playlist{}
	for _, pl := range pls {
		if pl.ParentPersistentID == nil {
			if pl.OwnerID == me {
				top = append(top, pl)
			} else {
				shr, ok := shared[pl.OwnerID]
				if ok {
					shared[pl.OwnerID] = append(shr, pl)
				} else {
					shared[pl.OwnerID] = []*Playlist{pl}
				}
			}
		} else {
			parent, ok := plm[*pl.ParentPersistentID]
			if ok {
				if parent.Children == nil {
					parent.Children = []*Playlist{}
				}
				parent.Children = append(parent.Children, pl)
			} else {
				if pl.OwnerID == me {
					top = append(top, pl)
				} else {
					shr, ok := shared[pl.OwnerID]
					if ok {
						shared[pl.OwnerID] = append(shr, pl)
					} else {
						shared[pl.OwnerID] = []*Playlist{pl}
					}
				}
			}
		}
	}

	/*
	for _, pl := range pls {
		pl.SortFolder()
	}
	*/
	if root == nil {
		users, err := db.ListUsers()
		if err == nil {
			for _, user := range users {
				shr, ok := shared[user.PersistentID]
				if ok {
					f := user.SharedFolder()
					f.Children = shr
					top = append(top, f)
				}
			}
		}
		/*
		log.Println("---------------------------------------------")
		log.Println("orig sort order:")
		for i, pl := range top {
			log.Printf("%d: %s (%s / %d)", i, pl.Name, pl.Kind, int(pl.Kind))
		}
		log.Println("sorting top level playlists")
		sort.Sort(SortablePlaylistList(top))
		for i, pl := range top {
			log.Printf("%d: %s (%s / %d)", i, pl.Name, pl.Kind, int(pl.Kind))
		}
		*/
		return top, nil
	}
	parent, ok := plm[*root]
	if ok {
		return parent.Children, nil
	}
	shr, ok := shared[*root]
	if ok {
		return shr, nil
	}
	return nil, errors.WithStack(NoSuchPlaylistFolder)
}

func (db *DB) Genres(ownerId *pid.PersistentID) ([]*Genre, error) {
	qs := `SELECT genre, sort_genre, COUNT(*) FROM track WHERE genre IS NOT NULL`
	args := []interface{}{}
	if ownerId != nil {
		qs += ` AND owner_id = ?`
		args = append(args, *ownerId)
	}
	qs += ` GROUP BY sort_genre, genre`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	gmap := map[string]*Genre{}
	keys := []string{}
	for rows.Next() {
		var g, sg *string
		var c int
		err = rows.Scan(&g, &sg, &c)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan genre info")
		}
		if g == nil || *g == "" {
			continue
		}
		if sg == nil {
			sg = stringp(MakeSort(*g))
			if sg == nil {
				continue
			}
		}
		genre, ok := gmap[*sg]
		if ok {
			genre.Names[*g] += c
		} else {
			gmap[*sg] = &Genre{
				SortName: *sg,
				Names: map[string]int{*g: c},
				db: db,
			}
			keys = append(keys, *sg)
		}
	}
	sort.Strings(keys)
	genres := make([]*Genre, len(keys))
	for i, key := range keys {
		genres[i] = gmap[key]
	}
	return genres, nil
}

func (db *DB) getArtists(col string, genre *Genre, ownerId *pid.PersistentID) (map[string]*Artist, error) {
	qs := fmt.Sprintf(`SELECT %s, %s, COUNT(*) FROM track WHERE %s IS NOT NULL`, pq.QuoteIdentifier(col), pq.QuoteIdentifier("sort_" + col), pq.QuoteIdentifier(col))
	args := []interface{}{}
	if genre != nil {
		qs += " AND sort_genre = ?"
		args = append(args, genre.SortName)
	}
	if ownerId != nil {
		qs += ` AND owner_id = ?`
		args = append(args, *ownerId)
	}
	qs += fmt.Sprintf(" GROUP BY %s, %s", pq.QuoteIdentifier(col), pq.QuoteIdentifier("sort_" + col))
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	amap := map[string]*Artist{}
	for rows.Next() {
		var a, sa string
		var c int
		err = rows.Scan(&a, &sa, &c)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan artist info")
		}
		artist, ok := amap[sa]
		if ok {
			artist.Names[a] = c
		} else {
			amap[sa] = &Artist{
				SortName: sa,
				Names: map[string]int{a: c},
				db: db,
			}
		}
	}
	return amap, nil
}

func (db *DB) searchArtist(col string, name string, s Search) (*Artist, error) {
	filters := []string{}
	args := []interface{}{}
	filters = append(filters, pq.QuoteIdentifier("sort_" + col) + " = ?")
	args = append(args, name)
	if s.Genre != nil {
		filters = append(filters, "sort_genre = ?")
		args = append(args, *s.Genre)
	}
	if s.Album != nil {
		filters = append(filters, "sort_album = ?")
		args = append(args, *s.Album)
	}
	if s.Name != nil {
		filters = append(filters, "sort_name = ?")
		args = append(args, *s.Name)
	}
	if s.OwnerID != nil {
		filters = append(filters, "owner_id = ?")
		args = append(args, *s.OwnerID)
	}
	qs := fmt.Sprintf(`SELECT %s, COUNT(*) FROM track WHERE %s GROUP BY %s`, pq.QuoteIdentifier(col), strings.Join(filters, " AND "), pq.QuoteIdentifier(col))
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	artist := &Artist{
		SortName: name,
		Names: map[string]int{},
		db: db,
	}
	for rows.Next() {
		var a string
		var c int
		err = rows.Scan(&a, &c)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan artist info")
		}
		artist.Names[a] = c
	}
	return artist, nil
}

func (db *DB) SearchArtist(name string, s Search) (*Artist, error) {
	cols := []string{
		"artist",
		"album_artist",
		"composer",
	}
	var artist *Artist
	for _, col := range cols {
		art, err := db.searchArtist(col, name, s)
		if err != nil {
			return nil, errors.Wrapf(err, "can't search %s %s", col, name)
		}
		if art != nil {
			if artist == nil {
				artist = art
			}
			for k, v := range art.Names {
				artist.Names[k] += v
			}
		}
	}
	return artist, nil
}

func (db *DB) ArtistGenres(name string, s Search) ([]*Genre, error) {
	filters := []string{}
	args := []interface{}{}
	if s.Genre != nil {
		filters = append(filters, "sort_genre = ?")
		args = append(args, *s.Genre)
	}
	if s.Album != nil {
		filters = append(filters, "sort_album = ?")
		args = append(args, *s.Album)
	}
	if s.Name != nil {
		filters = append(filters, "sort_name = ?")
		args = append(args, *s.Name)
	}
	if s.OwnerID != nil {
		filters = append(filters, "owner_id = ?")
		args = append(args, *s.OwnerID)
	}
	qs := `SELECT genre, sort_genre, COUNT(*) FROM track WHERE `
	if len(filters) > 0 {
		qs += strings.Join(filters, " AND ")
		qs += " AND "
	}
	qs += `(sort_artist = ? OR sort_album_artist = ? OR sort_composer = ?) GROUP BY genre, sort_genre ORDER BY sort_genre`
	args = append(args, name, name, name)
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	gmap := map[string]*Genre{}
	keys := []string{}
	for rows.Next() {
		var g, sg *string
		var c int
		err = rows.Scan(&g, &sg, &c)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan genre info")
		}
		if g == nil || *g == "" {
			continue
		}
		if sg == nil {
			sg = stringp(MakeSort(*g))
			if sg == nil {
				continue
			}
		}
		genre, ok := gmap[*sg]
		if ok {
			genre.Names[*g] += c
		} else {
			genre = &Genre{
				SortName: *sg,
				Names: map[string]int{*g: c},
				db: db,
			}
			gmap[*sg] = genre
			keys = append(keys, *sg)
		}
	}
	genres := make([]*Genre, len(keys))
	for i, key := range keys {
		genres[i] = gmap[key]
	}
	return genres, nil
}

func (db *DB) Artists(ownerId *pid.PersistentID) ([]*Artist, error) {
	return db.GenreArtists(nil, ownerId)
}

func (db *DB) searchArtists(filter string, args []interface{}) ([]*Artist, error) {
	qs := `SELECT (CASE album_artist WHEN NULL THEN artist ELSE album_artist END) AS art, (CASE album_artist WHEN NULL THEN sort_artist ELSE sort_album_artist END) AS sart, COUNT(*) FROM track`
	if filter != "" {
		qs += ` WHERE `+ filter
	}
	qs += ` GROUP BY art, sart ORDER BY sart`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	amap := map[string]*Artist{}
	keys := []string{}
	for rows.Next() {
		var a, sa *string
		var c int
		err = rows.Scan(&a, &sa, &c)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan artist info")
		}
		if a == nil || *a == "" {
			continue
		}
		if sa == nil {
			sa = stringp(MakeSortArtist(*a))
			if sa == nil {
				continue
			}
		}
		artist, ok := amap[*sa]
		if ok {
			artist.Names[*a] = c
		} else {
			amap[*sa] = &Artist{
				SortName: *sa,
				Names: map[string]int{*a: c},
			}
			keys = append(keys, *sa)
		}
	}
	artists := make([]*Artist, len(keys))
	for i, key := range keys {
		artists[i] = amap[key]
	}
	return artists, nil
}

func (db *DB) GenreArtists(genre *Genre, ownerId *pid.PersistentID) ([]*Artist, error) {
	filter := []string{}
	args := []interface{}{}
	if genre != nil {
		filter = append(filter, `sort_genre = ?`)
		args = append(args, genre.SortName)
	}
	if ownerId != nil {
		filter = append(filter, `owner_id = ?`)
		args = append(args, *ownerId)
	}
	return db.searchArtists(strings.Join(filter, " AND "), args)
}

func (db *DB) searchAlbums(filter string, args []interface{}) ([]*Album, error) {
	qs := `SELECT album_artist, sort_album_artist, artist, sort_artist, album, sort_album, COUNT(*) FROM track WHERE album IS NOT NULL`
	if filter != "" {
		qs += ` AND (` + filter + `)`
	}
	qs += ` GROUP BY album_artist, sort_album_artist, artist, sort_artist, album, sort_album ORDER BY sort_album`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	artmap := map[string]*Artist{}
	albmap := map[string]*Album{}
	keys := []string{}
	for rows.Next() {
		var aart, saart, art, sart, alb, salb *string
		var key string
		var c int
		err = rows.Scan(&aart, &saart, &art, &sart, &alb, &salb, &c)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan album info")
		}
		if alb == nil || *alb == "" {
			continue
		}
		if salb == nil {
			salb = stringp(MakeSort(*alb))
			if salb == nil {
				continue
			}
		}
		var artist *Artist
		var ok bool
		if aart != nil && saart != nil {
			artist, ok = artmap[*saart]
			if ok {
				artist.Names[*aart] += c
			} else {
				artist = &Artist{
					SortName: *saart,
					Names: map[string]int{*aart: c},
					db: db,
				}
				artmap[*saart] = artist
			}
			key = *saart + " || " + *salb
		} else if art != nil && sart != nil {
			artist, ok = artmap[*sart]
			if ok {
				artist.Names[*art] += c
			} else {
				artist = &Artist{
					SortName: *sart,
					Names: map[string]int{*art: c},
					db: db,
				}
				artmap[*sart] = artist
			}
			key = *sart + " || " + *salb
		} else {
			key = "~~~ || " + *salb
		}
		album, ok := albmap[key]
		if ok {
			album.Names[*alb] += c
		} else {
			albmap[key] = &Album{
				Artist: artist,
				SortName: *salb,
				Names: map[string]int{*alb: c},
			}
			keys = append(keys, key)
		}
	}
	sort.Strings(keys)
	albums := make([]*Album, len(keys))
	for i, key := range keys {
		albums[i] = albmap[key]
	}
	return albums, nil
}

func (db *DB) GetAlbums(artist *Artist, genre *Genre, ownerId *pid.PersistentID) ([]*Album, error) {
	filters := []string{}
	args := []interface{}{}
	if artist != nil {
		filters = append(filters,  "(sort_artist = ? OR sort_album_artist = ?)")// OR sort_composer = ?)")
		args = append(args, artist.SortName, artist.SortName)//, artist.SortName)
	}
	if genre != nil {
		filters = append(filters, "sort_genre = ?")
		args = append(args, genre.SortName)
	}
	if ownerId != nil {
		filters = append(filters, "owner_id = ?")
		args = append(args, *ownerId)
	}
	filter := strings.Join(filters, " AND ")
	return db.searchAlbums(filter, args)
}

func (db *DB) Albums(ownerId *pid.PersistentID) ([]*Album, error) {
	return db.GetAlbums(nil, nil, ownerId)
}

func (db *DB) ArtistAlbums(artist *Artist, ownerId *pid.PersistentID) ([]*Album, error) {
	return db.GetAlbums(artist, nil, ownerId)
}

func (db *DB) GenreAlbums(genre *Genre, ownerId *pid.PersistentID) ([]*Album, error) {
	return db.GetAlbums(nil, genre, ownerId)
}

func (db *DB) AlbumTracks(album *Album, ownerId *pid.PersistentID) ([]*Track, error) {
	qs := `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE sort_album = ?`
	args := []interface{}{album.SortName}
	if album.Artist != nil {
		qs += ` AND ((sort_album_artist IS NULL AND sort_artist = ?) OR sort_album_artist = ?)`
		args = append(args, album.Artist.SortName, album.Artist.SortName)
	}
	if ownerId != nil {
		qs += ` AND track.owner_id = ?`
		args = append(args, *ownerId)
	}
	qs += ` ORDER BY disc_number, track_number, sort_name`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var track Track
		err = rows.StructScan(&track)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into track")
		}
		tracks = append(tracks, &track)
	}
	return tracks, nil
}

func (db *DB) ArtistTracks(artist *Artist, ownerId *pid.PersistentID) ([]*Track, error) {
	qs := `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE (sort_artist = ? OR sort_album_artist = ? OR sort_composer = ?)`
	args := []interface{}{
		artist.SortName,
		artist.SortName,
		artist.SortName,
	}
	if ownerId != nil {
		qs += ` AND track.owner_id = ?`
		args = append(args, *ownerId)
	}
	qs += ` ORDER BY sort_album_artist, sort_album, disc_number, track_number, sort_name`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var track Track
		err = rows.StructScan(&track)
		if err != nil {
			return nil, errors.Wrap(err, "can't scan row into track")
		}
		track.db = db
		tracks = append(tracks, &track)
	}
	return tracks, nil
}

func (db *DB) GenreTracks(genre *Genre, ownerId *pid.PersistentID) ([]*Track, error) {
	qs := `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE sort_genre = ?`
	args := []interface{}{genre.SortName}
	if ownerId != nil {
		qs += ` AND track.owner_id = ?`
		args = append(args, *ownerId)
	}
	qs += ` ORDER BY sort_album_artist, sort_album, disc_number, track_number, sort_name`
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var track Track
		err = rows.StructScan(&track)
		if err != nil {
			return nil, err
		}
		track.db = db
		tracks = append(tracks, &track)
	}
	return tracks, nil
}

func (db *DB) Playlists(parent *Playlist) ([]*Playlist, error) {
	qs := `SELECT * FROM playlist WHERE parent_id `;
	args := []interface{}{}
	if parent == nil {
		qs += "IS NULL"
	} else {
		qs += "= ?"
		args = append(args, parent.PersistentID)
	}
	qs += " ORDER BY kind, name"
	rows, err := db.Query(qs, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	playlists := []*Playlist{}
	for rows.Next() {
		var playlist Playlist
		err = rows.StructScan(&playlist)
		if err != nil {
			return nil, err
		}
		playlist.db = db
		playlists = append(playlists, &playlist)
	}
	return playlists, nil
}

func (db *DB) PlaylistTracks(pl *Playlist) ([]*Track, error) {
	qs := `SELECT track.*, xuser.homedir FROM playlist_track, track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE playlist_track.playlist_id = ? AND playlist_track.track_id = track.id ORDER BY playlist_track.position`
	rows, err := db.Query(qs, pl.PersistentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var track Track
		err = rows.StructScan(&track)
		if err != nil {
			return nil, err
		}
		track.db = db
		tracks = append(tracks, &track)
	}
	return tracks, nil
}

func (db *DB) PlaylistTrackIDs(pl *Playlist) ([]pid.PersistentID, error) {
	qs := `SELECT track_id AS id FROM playlist_track WHERE playlist_id = ? ORDER BY playlist_track.position`
	rows, err := db.Query(qs, pl.PersistentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := []pid.PersistentID{}
	for rows.Next() {
		var p pid.PersistentID
		err = rows.Scan(&p)
		if err != nil {
			return nil, err
		}
		ids = append(ids, p)
	}
	return ids, nil
}

func (db *DB) FolderTracks(folder *Playlist) ([]*Track, error) {
	owner := &User{PersistentID: folder.OwnerID}
	items := map[pid.PersistentID]*Track{}
	children, err := db.GetPlaylistTree(&folder.PersistentID, owner)
	if err != nil {
		return nil, err
	}
	var tracks []*Track
	for _, child := range children {
		if child.Folder {
			tracks, err = db.FolderTracks(child)
		} else if child.Smart != nil {
			tracks, err = db.SmartTracks(child.Smart)
		} else {
			tracks, err = db.PlaylistTracks(child)
		}
		if err != nil {
			log.Printf("error getting folder child (%s %s): %s", child.PersistentID, child.Name, err)
			return nil, err
		}
		for _, track := range tracks {
			items[track.PersistentID] = track
		}
	}
	tracks = make([]*Track, len(items))
	i := 0
	for _, track := range items {
		tracks[i] = track
		i++
	}
	return tracks, nil
}

type sortableTracksByName []*Track
func (st sortableTracksByName) Len() int { return len(st) }
func (st sortableTracksByName) Swap(i, j int) { st[i], st[j] = st[j], st[i] }
func (st sortableTracksByName) Less(i, j int) bool {
	if st[i].Name == nil {
		if st[j].Name == nil {
			return st[i].PersistentID < st[j].PersistentID
		}
		return false
	}
	if st[j].Name == nil {
		return true
	}
	if *st[i].Name == *st[j].Name {
		return st[i].PersistentID < st[j].PersistentID
	}
	return *st[i].Name < *st[j].Name
}

func (db *DB) UpdateFolderTracks() error {
	qs := "SELECT * FROM playlist WHERE folder = 't'"
	rows, err := db.Query(qs)
	if err != nil {
		return err
	}
	defer rows.Close()
	pls := []*Playlist{}
	for rows.Next() {
		var pl Playlist
		err = rows.StructScan(&pl)
		if err != nil {
			return errors.Wrap(err, "can't scan row into playlist")
		}
		pls = append(pls, &pl)
	}
	for _, pl := range pls {
		tracks, err := db.FolderTracks(pl)
		if err != nil {
			return err
		}
		sort.Sort(sortableTracksByName(tracks))
		trackIds := make([]pid.PersistentID, len(tracks))
		for i, track := range tracks {
			trackIds[i] = track.PersistentID
		}
		pl.TrackIDs = trackIds
		err = db.SavePlaylistTracks(pl)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *DB) UpdateSmartTracks() error {
	qs := "SELECT * FROM playlist WHERE smart IS NOT NULL"
	rows, err := db.Query(qs)
	if err != nil {
		return err
	}
	defer rows.Close()
	pls := []*Playlist{}
	for rows.Next() {
		var pl Playlist
		err = rows.StructScan(&pl)
		if err != nil {
			return errors.Wrap(err, "can't scan row into playlist")
		}
		pls = append(pls, &pl)
	}
	for _, pl := range pls {
		if pl.Smart == nil || !pl.Smart.LiveUpdating {
			continue
		}
		tracks, err := db.SmartTracks(pl.Smart)
		if err != nil {
			return err
		}
		trackIds := make([]pid.PersistentID, len(tracks))
		for i, track := range tracks {
			trackIds[i] = track.PersistentID
		}
		pl.TrackIDs = trackIds
		err = db.SavePlaylistTracks(pl)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *DB) hasPlaylistRule(rs *RuleSet) bool {
	for _, rule := range rs.Rules {
		if rule.RuleType == PlaylistRule {
			return true
		}
		if rule.RuleType == RulesetRule && db.hasPlaylistRule(rule.RuleSet) {
			return true
		}
	}
	return false
}

func (db *DB) playlistRules(rs *RuleSet) []*Rule {
	rules := []*Rule{}
	for _, rule := range rs.Rules {
		if rule.RuleType == PlaylistRule {
			rules = append(rules, rule)
		} else if rule.RuleType == RulesetRule {
			rules = append(rules, db.playlistRules(rule.RuleSet)...)
		}
	}
	return rules
}

const queryKeys = "abcdefghijklmnopqrstuvwxyz"
func queryKey(i int) string {
	l := len(queryKeys)
	if i >= l {
		j := i / l
		if j >= l {
			return ""
		}
		k := i % l
		return queryKeys[j:j+1] + queryKeys[k:k+1]
	}
	return queryKeys[i:i+1]
}

func (db *DB) SmartTracks(spl *Smart) ([]*Track, error) {
	maxs := int64(math.MaxInt64)
	maxt := int64(math.MaxInt64)
	var qs string
	xargs := []interface{}{}
	if db.hasPlaylistRule(spl.RuleSet) {
		qs = `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id`
		for i, rule := range db.playlistRules(spl.RuleSet) {
			key := queryKey(i)
			rule.playlistKey = key
			qs += ` LEFT OUTER JOIN playlist_track pt` + key + ` ON track.id = pt` + key + `.track_id`
			if rule.PlaylistValue != nil {
				qs += ` AND pt` + key + `.playlist_id = ?`
				xargs = append(xargs, rule.PlaylistValue)
			}
		}
	} else {
		qs = `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id`
	}
	where, args := spl.RuleSet.Where()
	qs += ` WHERE track.location IS NOT NULL AND (` + where + ")"
	args = append(xargs, args...)
	if spl.Limit != nil {
		qs += spl.Limit.Order()
		if spl.Limit.MaxSize != nil {
			maxs = int64(*spl.Limit.MaxSize)
		}
		if spl.Limit.MaxTime != nil {
			maxt = int64(*spl.Limit.MaxTime)
		}
	}
	seen := map[pid.PersistentID]bool{}
	//log.Println("SmartTracks:", qs, args)
	rows, err := db.Query(qs, args...)
	if err != nil {
		log.Println("error in SmartTracks query [", qs, args, "]: ", err)
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	i := 0
	for rows.Next() {
		i += 1
		var track Track
		err = rows.StructScan(&track)
		if err != nil {
			return nil, err
		}
		if seen[track.PersistentID] {
			continue
		}
		seen[track.PersistentID] = true
		if track.Size != nil {
			maxs -= int64(*track.Size)
		}
		if track.TotalTime != nil {
			maxt -= int64(*track.TotalTime)
		}
		if maxs < 0 || maxt < 0 {
			break
		}
		track.db = db
		tracks = append(tracks, &track)
		/*
		if i % 100 == 0 {
			log.Printf("%d tracks...", i)
		}
		*/
	}
	log.Printf("%d tracks", len(tracks))
	return tracks, nil
}

type IDable interface {
	ID() pid.PersistentID
	SetID(pid.PersistentID)
}

func (db *DB) insertStruct(tx *Tx, obj IDable) error {
	rv := reflect.ValueOf(obj)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	rt := rv.Type()
	cols := []string{}
	vals := []interface{}{}
	qms := []string{}
	n := rv.NumField()
	for i := 0; i < n; i++ {
		f := rt.Field(i)
		if f.PkgPath != "" {
			continue
		}
		tag := f.Tag.Get("dbignore")
		if strings.Contains(tag, "insert") {
			continue
		}
		tag = strings.Split(f.Tag.Get("db"), ",")[0]
		if tag == "" {
			tag = strings.ToLower(f.Name)
		}
		if tag == "-" {
			continue
		}
		cols = append(cols, pq.QuoteIdentifier(tag))
		vals = append(vals, rv.Field(i).Interface())
		qms = append(qms, "?")
	}
	qs := fmt.Sprintf(`INSERT INTO %s (%s) VALUES(%s)`, pq.QuoteIdentifier(strings.ToLower(rv.Type().Name())), strings.Join(cols, ","), strings.Join(qms, ","))
	_, err := tx.Exec(qs, vals...)
	return err
}

func (db *DB) updateStruct(tx *Tx, obj IDable) error {
	rv := reflect.ValueOf(obj)
	if rv.Kind() == reflect.Ptr {
		rv = rv.Elem()
	}
	rt := rv.Type()
	cols := []string{}
	vals := []interface{}{}
	n := rv.NumField()
	for i := 0; i < n; i++ {
		f := rt.Field(i)
		if f.PkgPath != "" {
			continue
		}
		tag := f.Tag.Get("dbignore")
		if strings.Contains(tag, "update") {
			continue
		}
		tag = strings.Split(f.Tag.Get("db"), ",")[0]
		if tag == "" {
			tag = strings.ToLower(f.Name)
		}
		if tag == "-" {
			continue
		}
		if tag == "id" {
			continue
		}
		cols = append(cols, fmt.Sprintf("%s = ?", pq.QuoteIdentifier(tag)))
		vals = append(vals, rv.Field(i).Interface())
	}
	qs := fmt.Sprintf(`UPDATE %s SET %s WHERE id = ?`, pq.QuoteIdentifier(strings.ToLower(rv.Type().Name())), strings.Join(cols, ", "))
	vals = append(vals, obj.ID())
	//log.Println(qs, vals)
	_, err := tx.Exec(qs, vals...)
	return err
}

func (db *DB) saveStruct(tx *Tx, obj IDable) error {
	if obj.ID() == pid.PersistentID(0) {
		obj.SetID(pid.NewPersistentID())
		err := db.insertStruct(tx, obj)
		if err != nil {
			obj.SetID(pid.PersistentID(0))
			return err
		}
		return nil
	}
	return db.updateStruct(tx, obj)
}

func (db *DB) ImageExtension(ct string) string {
	if ct == "image/jpeg" {
		return ".jpg"
	}
	if ct == "image/png" {
		return ".png"
	}
	if ct == "image/gif" {
		return ".gif"
	}
	exts, err := mime.ExtensionsByType(ct)
	if err != nil && len(exts) > 0 {
		return exts[0]
	}
	log.Println("no idea what ext to use for mime type", ct)
	return ".img"
}

func (db *DB) extractTrackArtwork(tx *Tx, track *Track) error {
	if track.ArtworkURL != nil && strings.HasPrefix(*track.ArtworkURL, "data:") {
		log.Println("track has artwork")
		parts := strings.SplitN((*track.ArtworkURL)[5:], ";", 2)
		ext := db.ImageExtension(parts[0])
		if len(parts) > 1 {
			parts = strings.SplitN(parts[1], ",", 2)
			if len(parts) > 1 {
				data, err := base64.StdEncoding.DecodeString(parts[1])
				if err == nil {
					fn, err := db.saveTrackArtwork(tx, track, ext, data)
					if err == nil {
						track.ArtworkURL = nil
						log.Println("saved artwork to", fn)
					} else {
						log.Println("error saving artwork:", err)
					}
				} else {
					log.Println("error decoding base64 data:", err)
				}
			} else {
				log.Println("malformed encoding")
			}
		} else {
			log.Println("malformed data url")
		}
	} else {
		log.Println("no artwork data")
	}
	return nil
}

func (db *DB) SaveTrack(track *Track) error {
	err := track.Validate()
	if err != nil {
		return err
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	db.extractTrackArtwork(tx, track)
	err = db.saveStruct(tx, track)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (db *DB) SaveTracks(tracks []*Track) error {
	for _, track := range tracks {
		err := track.Validate()
		if err != nil {
			return err
		}
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	for _, track := range tracks {
		db.extractTrackArtwork(tx, track)
		err = db.saveStruct(tx, track)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (db *DB) SavePlaylist(playlist *Playlist) error {
	err := playlist.Validate()
	if err != nil {
		return err
	}
	now := Now()
	if playlist.DateAdded == nil {
		playlist.DateAdded = &now
	}
	if playlist.DateModified == nil {
		playlist.DateModified = &now
	}
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.saveStruct(tx, playlist)
	if err != nil {
		tx.Rollback()
		return err
	}
	owner := &User{PersistentID: playlist.OwnerID}
	parent := playlist
	for parent.ParentPersistentID != nil {
		if *parent.ParentPersistentID == playlist.PersistentID {
			tx.Rollback()
			return CircularPlaylistFolder
		}
		parent, err = db.GetPlaylist(*parent.ParentPersistentID, owner)
		if err != nil {
			tx.Rollback()
			return err
		}
		if parent == nil {
			tx.Rollback()
			return NoSuchPlaylistFolder
		}
		if !parent.Folder {
			tx.Rollback()
			return ParentNotAFolder
		}
	}
	if playlist.TrackIDs != nil && len(playlist.TrackIDs) > 0 {
		err = db.savePlaylistTracksWithTx(playlist, tx)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (db *DB) savePlaylistTracksWithTx(playlist *Playlist, tx *Tx) error {
	qs := `DELETE FROM playlist_track WHERE playlist_id = ?`
	_, err := tx.Exec(qs, playlist.PersistentID)
	if err != nil {
		return err
	}
	if playlist.Folder || playlist.Smart != nil {
		return nil
	}
	qs = `INSERT INTO playlist_track (playlist_id, track_id, position) VALUES(?, ?, ?)`
	st, err := tx.Prepare(qs)
	if err != nil {
		return err
	}
	for i, trid := range playlist.TrackIDs {
		_, err = st.Exec(playlist.PersistentID, trid, i)
		if err != nil {
			return err
		}
	}
	return nil
}

func (db *DB) SavePlaylistTracks(playlist *Playlist) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.savePlaylistTracksWithTx(playlist, tx)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (db *DB) DeleteTrackFromPlaylist(playlist *Playlist, trid pid.PersistentID) error {
	return db.DeleteTracksFromPlaylist(playlist, []pid.PersistentID{trid})
}

func (db *DB) DeleteTracksFromPlaylist(playlist *Playlist, trids []pid.PersistentID) error {
	trackIds, err := db.PlaylistTrackIDs(playlist)
	if err != nil {
		return err
	}
	delIds := map[pid.PersistentID]bool{}
	for _, id := range trids {
		delIds[id] = true
	}
	dirty := false
	saveIds := make([]pid.PersistentID, 0, len(trackIds))
	for _, id := range trackIds {
		if _, ok := delIds[id]; !ok {
			saveIds = append(saveIds, id)
		} else {
			dirty = true
		}
	}
	playlist.TrackIDs = saveIds
	if !dirty {
		return nil
	}
	return db.SavePlaylistTracks(playlist)
}

type PlaylistTrackRef struct {
	TrackID pid.PersistentID
	Position int
}

func (db *DB) DeleteTrackFromPlaylistAt(playlist *Playlist, trid pid.PersistentID, pos int) error {
	refs := []PlaylistTrackRef{
		PlaylistTrackRef{TrackID: trid, Position: pos},
	}
	return db.DeleteTracksFromPlaylistAt(playlist, refs)
}

func (db *DB) DeleteTracksFromPlaylistAt(playlist *Playlist, refs []PlaylistTrackRef) error {
	trackIds, err := db.PlaylistTrackIDs(playlist)
	if err != nil {
		return err
	}
	delIds := make([]*pid.PersistentID, len(trackIds))
	for _, ref := range refs {
		if ref.Position >= len(delIds) {
			continue
		}
		delIds[ref.Position] = &ref.TrackID
	}
	dirty := false
	saveIds := make([]pid.PersistentID, 0, len(trackIds))
	for i, id := range trackIds {
		if delIds[i] == nil || *delIds[i] != id {
			saveIds = append(saveIds, id)
		} else {
			dirty = true
		}
	}
	playlist.TrackIDs = saveIds
	if !dirty {
		return nil
	}
	return db.SavePlaylistTracks(playlist)
}

func (db *DB) DeleteTrack(tr *Track) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.deleteTrackId(tx, tr.PersistentID)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (db *DB) deleteTrackId(tx *Tx, id pid.PersistentID) error {
	qs := `DELETE FROM playlist_track WHERE track_id = ?`
	_, err := tx.Exec(qs, id)
	if err != nil {
		return err
	}
	qs = `DELETE FROM track WHERE id = ?`;
	_, err = tx.Exec(qs, id)
	return err
}

func (db *DB) DeletePlaylist(pl *Playlist) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.deletePlaylistId(tx, pl.PersistentID)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (db *DB) deletePlaylistId(tx *Tx, id pid.PersistentID) error {
	qs := `DELETE FROM playlist_track WHERE playlist_id = ?`
	_, err := tx.Exec(qs, id)
	if err != nil {
		return err
	}
	qs = `DELETE FROM playlist WHERE id = ?`
	_, err = tx.Exec(qs, id)
	if err != nil {
		return err
	}
	qs = `SELECT COUNT(*) FROM playlist WHERE parent_id = ?`
	row := tx.QueryRow(qs, id)
	var c int
	err = row.Scan(&c)
	if err != nil {
		return err
	}
	if c != 0 {
		return PlaylistFolderNotEmpty
	}
	return nil
}

func (db *DB) UpdateITunesTrack(tr *loader.Track, user *User) (bool, error) {
	if tr.PersistentID == nil {
		return false, errors.New("track has no persistent id")
	}
	xtr := tr.Clone()
	xtr.TrackID = nil
	id := tr.PersistentID.String()
	qs := `SELECT data FROM itunes_track WHERE id = ? AND owner_id = ?`
	row := db.QueryRow(qs, id, user.PersistentID)
	var data []byte
	err := row.Scan(&data)
	if err != nil {
		if err == sql.ErrNoRows {
			track := TrackFromITunes(tr)
			track.OwnerID = user.PersistentID
			track.Validate()
			tx, err := db.Begin()
			if err != nil {
				return true, err
			}
			err = db.insertStruct(tx, track)
			if err != nil {
				log.Printf("difficulty with track %s", track.PersistentID.String())
				tx.Rollback()
				return true, err
			}
			qs = `INSERT INTO itunes_track (id, data, mod_date, owner_id) VALUES(?, ?, ?, ?)`
			_, err = tx.Exec(qs, id, serializeGob(tr), time.Now().In(time.UTC), user.PersistentID)
			if err != nil {
				tx.Rollback()
				log.Println("erorr %s in %s", err.Error(), qs)
				return true, err
			}
			return true, tx.Commit()
		}
		return false, err
	}
	mydata := serializeGob(xtr)
	if bytes.Equal(data, mydata) {
		return false, nil
	}
	qs = `SELECT * FROM track WHERE id = ? AND owner_id = ?`
	row = db.QueryRow(qs, *tr.PersistentID, user.PersistentID)
	track := &Track{}
	err = row.StructScan(track)
	if err != nil {
		if err == sql.ErrNoRows {
			// track was deleted
			return false, nil
		}
		return true, err
	}
	orig := &loader.Track{}
	err = deserializeGob(data, orig)
	if err != nil {
		return true, err
	}
	/*
	origjs, _ := json.Marshal(orig)
	trjs, _ := json.Marshal(tr)
	log.Println("tracks differ:", string(origjs), "vs", string(trjs))
	*/
	track.Update(TrackFromITunes(orig), TrackFromITunes(tr))
	track.Validate()
	tx, err := db.Begin()
	if err != nil {
		return true, err
	}
	err = db.updateStruct(tx, track)
	if err != nil {
		log.Printf("difficulty with track %s", track.PersistentID.String())
		tx.Rollback()
		return true, err
	}
	qs = `UPDATE itunes_track SET data = ?, mod_date = ? WHERE id = ? AND owner_id = ?`
	_, err = tx.Exec(qs, mydata, time.Now().In(time.UTC), id, user.PersistentID)
	if err != nil {
		tx.Rollback()
		return true, err
	}
	return true, tx.Commit()
}

func (db *DB) UpdateITunesPlaylist(pl *loader.Playlist, user *User) (bool, error) {
	if pl.PersistentID == nil {
		return false, errors.New("playlist has no persistent id")
	}
	if *pl.PersistentID < 100 {
		return false, nil
	}
	id := pl.PersistentID.String()
	// get the last itunes version we loaded
	qs := `SELECT data FROM itunes_playlist WHERE id = ? AND owner_id = ?`
	row := db.QueryRow(qs, id, user.PersistentID)
	var data []byte
	err := row.Scan(&data)
	if err != nil {
		if err == sql.ErrNoRows {
			// new playlist
			playlist := PlaylistFromITunes(pl)
			if playlist.Kind == MasterPlaylist {
				return false, nil
			}
			playlist.OwnerID = user.PersistentID
			tx, err := db.Begin()
			if err != nil {
				return true, err
			}
			err = db.insertStruct(tx, playlist)
			if err != nil {
				log.Printf("difficulty with playlist %s", playlist.PersistentID.String())
				tx.Rollback()
				return true, err
			}
			err = db.savePlaylistTracksWithTx(playlist, tx)
			if err != nil {
				tx.Rollback()
				return true, err
			}
			qs = `INSERT INTO itunes_playlist (id, data, mod_date, owner_id) VALUES(?, ?, ?, ?)`
			_, err = tx.Exec(qs, id, serializeGob(pl), time.Now().In(time.UTC), user.PersistentID)
			if err != nil {
				tx.Rollback()
				return true, err
			}
			return true, tx.Commit()
		}
		// some other error
		return false, err
	}
	// existing playlist
	mydata := serializeGob(pl)
	if bytes.Equal(data, mydata) {
		// playlist hasn't changed
		return false, nil
	}
	// get the musicdb version of the playlist
	qs = `SELECT * FROM playlist WHERE id = ? AND owner_id = ?`
	row = db.QueryRow(qs, *pl.PersistentID, user.PersistentID)
	playlist := &Playlist{}
	err = row.StructScan(playlist)
	if err != nil {
		if err == sql.ErrNoRows {
			// playlist was deleted from musicdb, so ignore it
			return false, nil
		}
		return true, err
	}
	playlist.TrackIDs, err = db.PlaylistTrackIDs(playlist)
	if err != nil {
		return true, err
	}
	orig := &loader.Playlist{}
	err = deserializeGob(data, orig)
	if err != nil {
		return true, err
	}
	parentPid, parentUpdated := playlist.Update(PlaylistFromITunes(orig), PlaylistFromITunes(pl))
	if parentUpdated {
		playlist.ParentPersistentID = parentPid
	}
	tx, err := db.Begin()
	if err != nil {
		return true, err
	}
	err = db.updateStruct(tx, playlist)
	if err != nil {
		log.Printf("difficulty with playlist %s", playlist.PersistentID.String())
		tx.Rollback()
		return true, err
	}
	err = db.savePlaylistTracksWithTx(playlist, tx)
	if err != nil {
		tx.Rollback()
		return true, err
	}
	qs = `UPDATE itunes_playlist SET data = ?, mod_date = ? WHERE id = ? AND owner_id = ?`
	_, err = tx.Exec(qs, mydata, time.Now().In(time.UTC), id, user.PersistentID)
	if err != nil {
		tx.Rollback()
		return true, err
	}
	return true, tx.Commit()
}

func (db *DB) LoadITunesTrackIDs(user *User) (map[string]bool, error) {
	qs := `SELECT id FROM itunes_track WHERE owner_id = ?`
	rows, err := db.Query(qs, user.PersistentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := map[string]bool{}
	var id string
	for rows.Next() {
		rows.Scan(&id)
		ids[id] = true
	}
	return ids, nil
}

func (db *DB) LoadITunesPlaylistIDs(user *User) (map[string]bool, error) {
	qs := `SELECT id FROM itunes_playlist WHERE owner_id = ?`
	rows, err := db.Query(qs, user.PersistentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := map[string]bool{}
	var id string
	for rows.Next() {
		rows.Scan(&id)
		ids[id] = true
	}
	return ids, nil
}

func (db *DB) DeleteITunesTracks(ids map[string]bool, user *User) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	qs := `DELETE FROM itunes_track WHERE id = ? AND owner_id = ?`
	var xpid pid.PersistentID
	pid := &xpid
	for id := range ids {
		err = pid.Decode(id)
		if err != nil {
			continue
		}
		log.Println("deleting itunes track", id)
		_, err = tx.Exec(qs, id, user.PersistentID)
		if err != nil {
			tx.Rollback()
			return err
		}
		err = db.deleteTrackId(tx, *pid)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (db *DB) DeleteITunesPlaylists(ids map[string]bool, user *User) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	qs := `DELETE FROM itunes_playlist WHERE id = ? AND owner_id = ?`
	var xpid pid.PersistentID
	pid := &xpid
	for id := range ids {
		err = pid.Decode(id)
		if err != nil {
			continue
		}
		log.Println("deleting itunes playlist", id)
		_, err = tx.Exec(qs, id, user.PersistentID)
		if err != nil {
			tx.Rollback()
			return err
		}
		err = db.deletePlaylistId(tx, *pid)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (db *DB) FindTrack(tr *Track) {
	if uint64(tr.PersistentID) != 0 {
		xtr, err := db.GetTrack(tr.PersistentID)
		if err == nil {
			*tr = *xtr
			return
		}
	}
	if tr.JookiID != nil {
		qs := `SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE jooki_id = ?`
		row := db.QueryRow(qs, tr.JookiID)
		var xtr Track
		err := row.StructScan(&xtr)
		if err == nil {
			*tr = xtr
			return
		}
	}
	where := []string{}
	args := []interface{}{}
	if tr.Artist != nil {
		where = append(where, "artist = ?")
		args = append(args, *tr.Artist)
	}
	if tr.Album != nil {
		where = append(where, "album = ?")
		args = append(args, *tr.Album)
	}
	if tr.Name != nil {
		where = append(where, "name = ?")
		args = append(args, *tr.Name)
	}
	if tr.Size != nil {
		where = append(where, "size = ?")
		args = append(args, *tr.Size)
	}
	if tr.TotalTime != nil {
		where = append(where, "total_time >= ? AND total_time <= ?")
		args = append(args, *tr.TotalTime - 1000, *tr.TotalTime + 1000)
	}
	qs := fmt.Sprintf(`SELECT track.*, xuser.homedir FROM track LEFT OUTER JOIN xuser ON track.owner_id = xuser.id WHERE %s ORDER BY rating DESC, play_count DESC LIMIT 1`, strings.Join(where, " AND "))
	row := db.QueryRow(qs, args...)
	var xtr Track
	err := row.StructScan(&xtr)
	if err == nil {
		*tr = xtr
	}
}

func (db *DB) SaveTrackArtwork(tr *Track, ext string, data []byte) (string, error) {
	tx, err := db.Begin()
	if err != nil {
		return "", err
	}
	fn, err := db.saveTrackArtwork(tx, tr, ext, data)
	if err != nil {
		tx.Rollback()
		return fn, err
	}
	return fn, tx.Commit()
}

func (db *DB) saveTrackArtwork(tx *Tx, tr *Track, ext string, data []byte) (string, error) {
	if tr.Location == nil {
		return "", errors.New("track has no location")
	}
	dn := filepath.Dir(*tr.Location)
	qs := `SELECT COUNT(*) FROM track WHERE location LIKE ?`
	args := []interface{}{
		filepath.Join(dn, "%"),
	}
	if tr.Album == nil {
		qs += ` AND (album IS NOT NULL`
	} else {
		qs += ` AND (album != ?`
		args = append(args, *tr.Album)
	}
	if tr.AlbumArtist != nil {
		qs += ` OR album_artist != ?)`
		args = append(args, *tr.AlbumArtist)
	} else if tr.Artist != nil {
		qs += ` OR artist != ?)`
		args = append(args, tr.Artist)
	} else {
		qs += ` OR artist IS NOT NULL`;
	}
	log.Println(qs, args)
	row := tx.QueryRow(qs, args...)
	var n int64
	err := row.Scan(&n)
	log.Println("track is in file", tr.Path())
	xdn := filepath.Dir(tr.Path())
	var root string
	if err != nil {
		return "", err
	}
	if n == 0 {
		root = filepath.Join(xdn, "cover")
	} else {
		base := strings.TrimSuffix(filepath.Base(*tr.Location), filepath.Ext(*tr.Location))
		root = filepath.Join(xdn, "cover_" + base) //tr.PersistentID.String())
	}
	for _, ex := range []string{".jpg", ".png", ".gif"} {
		fn := root + ex
		_, err := os.Stat(fn)
		if err == nil {
			xerr := os.Remove(fn)
			if xerr != nil {
				return "", xerr
			}
		} else if !os.IsNotExist(err) {
			return "", err
		}
	}
	return root + ext, ioutil.WriteFile(root+ext, data, os.FileMode(0664))
}

func (db *DB) GetUser(username string) (auth.AuthUser, error) {
	query := `SELECT * FROM xuser WHERE username = ?`
	row := db.QueryRow(query, username)
	user := &User{}
	err := row.StructScan(user)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.WithStack(auth.ErrUnknownUser)
		}
		return nil, errors.WithStack(err)
	}
	user.db = db
	return user, nil
}

func (db *DB) GetUserByID(id int64) (auth.AuthUser, error) {
	query := `SELECT * FROM xuser WHERE id = ?`
	row := db.QueryRow(query, id)
	user := &User{}
	err := row.StructScan(user)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.WithStack(auth.ErrUnknownUser)
		}
		return nil, errors.WithStack(err)
	}
	user.db = db
	return user, nil
}

func (db *DB) GetUserByEmail(email string) (auth.AuthUser, error) {
	query := `SELECT * FROM xuser WHERE email = ?`
	row := db.QueryRow(query, email)
	user := &User{}
	err := row.StructScan(user)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.WithStack(auth.ErrUnknownUser)
		}
		return nil, errors.WithStack(err)
	}
	user.db = db
	return user, nil
}

func (db *DB) getColumnNameForDriver(driver string) (string, error) {
	switch driver {
	case "apple":
		return "apple_id", nil
	case "github":
		return "github_id", nil
	case "google":
		return "google_id", nil
	case "amazon":
		return "amazon_id", nil
	case "facebook":
		return "facebook_id", nil
	case "twitter":
		return "twitter_id", nil
	case "linkedin":
		return "linkedin_id", nil
	case "slack":
		return "slack_id", nil
	case "bitbucket":
		return "bitbucket_id", nil
	}
	return "", errors.WithStack(ErrUnknownSocialDriver)
}

func (db *DB) GetSocialUser(driver, id, username string) (auth.AuthUser, error) {
	key, err := db.getColumnNameForDriver(driver)
	if err != nil {
		return nil, err
	}
	query := fmt.Sprintf(`SELECT * FROM xuser WHERE %s = ?`, key)
	user := &User{}
	row := db.QueryRow(query, id)
	err = row.StructScan(user)
	if err == nil {
		user.db = db
		return user, nil
	}
	row = db.QueryRow(query, username)
	err = row.StructScan(user)
	if err == nil {
		user.db = db
		return user, nil
	}
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.WithStack(auth.ErrUnknownUser)
	}
	return nil, errors.WithStack(err)
}

func (db *DB) ListUsers() ([]*User, error) {
	query := `SELECT id, username, first_name, last_name, avatar, homedir FROM xuser WHERE active = 't' ORDER BY last_name, first_name`
	rows, err := db.Query(query)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	defer rows.Close()
	users := []*User{}
	for rows.Next() {
		user := &User{}
		err = rows.StructScan(user)
		if err != nil {
			return users, errors.WithStack(err)
		}
		user.db = db
		users = append(users, user)
	}
	return users, nil
}

func (db *DB) UserUpdateChannel() chan *User {
	if db.userChan == nil {
		db.userChan = make(chan *User, 10)
	}
	return db.userChan
}

func (db *DB) FindSpotifyTrack(st *spotify.Track) (*Track, error) {
	query := `SELECT * FROM track WHERE SIMILARITY(name, ?) > 0.3 AND SIMILARITY(artist, ?) > 0.5 ORDER BY SIMILARITY(name, ?) * (COALESCE(rating, 0) + 1) DESC, play_count DESC LIMIT 1`
	artists := []string{}
	as := st.Artists
	if len(as) == 0 {
		as = st.Album.Artists
	}
	for _, a := range as {
		artists = append(artists, a.Name)
	}
	var oxford string
	n := len(artists)
	if n == 1 {
		oxford = artists[0]
	} else if n > 1 {
		oxford = strings.Join(artists[:n-1], ", ") + ", and " + artists[n-1]
	}
	row := db.QueryRow(query, st.Name, oxford, st.Name)
	tr := &Track{}
	err := row.StructScan(tr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return tr, nil
}

func (db *DB) MixArtistTracks(artist string, ownerId *pid.PersistentID, minRating int, n int) ([]*Track, error) {
	query := `SELECT * FROM track WHERE (LOWER(artist) LIKE ? OR SIMILARITY(artist, ?) > 0.6)`
	args := []interface{}{
		"%" + strings.ToLower(artist) + "%",
		artist,
	}
	if minRating > 0 {
		query += ` AND rating IS NOT NULL AND rating >= ?`
		args = append(args, minRating)
	}
	if ownerId != nil {
		query += ` AND owner_id = ?`
		args = append(args, ownerId)
	}
	query += ` ORDER BY (SIMILARITY(artist, ?) + 0.01) * rating DESC, play_count`
	args = append(args, artist)
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	seen := map[string]bool{}
	for rows.Next() {
		track := &Track{}
		err = rows.StructScan(track)
		if err != nil {
			return nil, err
		}
		if !seen[track.GetSortName()] {
			seen[track.GetSortName()] = true
			tracks = append(tracks, track)
		}
	}
	if len(tracks) > n {
		out := make([]*Track, n)
		for i := range out {
			g := int(math.Abs(rand.NormFloat64()) * float64(len(tracks)) / 3)
			if g >= len(tracks) {
				g = 0
			}
			out[i] = tracks[g]
			tracks = append(tracks[:g], tracks[g+1:]...)
		}
		tracks = out
	}
	rand.Shuffle(len(tracks), func(i, j int) {
		tracks[i], tracks[j] = tracks[j], tracks[i]
	})
	return tracks, nil
}
