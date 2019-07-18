package musicdb

import (
	"bytes"
	"database/sql"
	"encoding/gob"
	"errors"
	"fmt"
	"log"
	"math"
	"reflect"
	"sort"
	"strings"
	"time"

	"github.com/lib/pq"
	"github.com/jmoiron/sqlx"

	"itunes/loader"
)

var CircularPlaylistFolder = errors.New("playlist can't be a descendant of itself")
var NoSuchPlaylistFolder = errors.New("playlist folder does not exist")
var ParentNotAFolder = errors.New("parent playlist is not a folder")
var PlaylistFolderNotEmpty = errors.New("Playlist folder not empty")

func serializeGob(obj interface{}) []byte {
	var buf bytes.Buffer
	enc := gob.NewEncoder(&buf)
	enc.Encode(obj)
	return buf.Bytes()
}

func deserializeGob(data []byte, obj interface{}) error {
	buf := bytes.NewBuffer(data)
	dec := gob.NewDecoder(buf)
	return dec.Decode(obj)
}

type DB struct {
	conn *sqlx.DB
}

func Open(connstr string) (*DB, error) {
	conn, err := sqlx.Connect("postgres", connstr)
	if err != nil {
		return nil, err
	}
	return &DB{ conn: conn }, nil
}

type Search struct {
	Genre *string
	Artist *string
	AlbumArtist *string
	Composer *string
	Album *string
	Name *string
}

func (db *DB) SearchTracks(s Search) ([]*Track, error) {
	filters := []string{}
	vals := []interface{}{}
	if s.Genre != nil {
		filters = append(filters, "sort_genre = ?")
		vals = append(vals, *s.Genre)
	}
	if s.Artist != nil {
		filters = append(filters, "sort_artist = ?")
		vals = append(vals, *s.Artist)
	}
	if s.AlbumArtist != nil {
		filters = append(filters, "sort_album_artist = ?")
		vals = append(vals, *s.AlbumArtist)
	}
	if s.Album != nil {
		filters = append(filters, "sort_album = ?")
		vals = append(vals, *s.Album)
	}
	if s.Name != nil {
		filters = append(filters, "sort_name = ?")
		vals = append(vals, *s.Name)
	}
	if len(filters) == 0 {
		return nil, errors.New("no search params")
	}
	qs := `SELECT * FROM track WHERE ` + strings.Join(filters, " AND ") + `ORDER BY sort_album_artist, sort_album, disc_number, track_number, sort_name`;
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
			return nil, err
		}
		track.db = db
		tracks = append(tracks, &track)
	}
	return tracks, nil
}

func (db *DB) TracksSinceCount(t Time) (int, error) {
	qs := `SELECT COUNT(*) FROM track WHERE date_modified >= ?`
	row := db.QueryRow(qs, t)
	var i int
	err := row.Scan(&i)
	if err != nil {
		return -1, err
	}
	return i, nil
}

func (db *DB) TracksSince(t Time, page, count int) ([]*Track, error) {
	qs := `SELECT * FROM track WHERE date_modified >= ? ORDER BY id`
	if count > 0 {
		qs += fmt.Sprintf(" LIMIT %d OFFSET %d", count, page * count)
	}
	rows, err := db.Query(qs, t)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tracks := []*Track{}
	for rows.Next() {
		var t Track
		err = rows.StructScan(&t)
		if err != nil {
			return nil, err
		}
		t.db = db
		tracks = append(tracks, &t)
	}
	return tracks, nil
}

func (db *DB) Tracks(page, count int, order []string) ([]*Track, error) {
	qs := `SELECT * FROM track ORDER BY`
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
			return nil, err
		}
		t.db = db
		tracks = append(tracks, &t)
	}
	return tracks, nil
}

func (db *DB) GetTrack(pid PersistentID) (*Track, error) {
	qs := `SELECT * FROM track WHERE id = ?`
	row := db.QueryRow(qs, pid)
	var track Track
	err := row.StructScan(&track)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &track, nil
}

func (db *DB) GetPlaylist(pid PersistentID) (*Playlist, error) {
	qs := `SELECT * FROM playlist WHERE id = ?`
	row := db.QueryRow(qs, pid)
	var pl Playlist
	err := row.StructScan(&pl)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &pl, nil
}

func (db *DB) GetPlaylistTree(root *PersistentID) ([]*Playlist, error) {
	qs := `SELECT * FROM playlist ORDER BY kind, name`
	rows, err := db.Query(qs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	plm := map[PersistentID]*Playlist{}
	pls := []*Playlist{}
	for rows.Next() {
		var pl Playlist
		err = rows.StructScan(&pl)
		if err != nil {
			return nil, err
		}
		plm[pl.PersistentID] = &pl
		pls = append(pls, &pl)
	}
	top := []*Playlist{}
	for _, pl := range pls {
		if pl.ParentPersistentID == nil {
			top = append(top, pl)
		} else {
			parent, ok := plm[*pl.ParentPersistentID]
			if ok {
				if parent.Children == nil {
					parent.Children = []*Playlist{}
				}
				parent.Children = append(parent.Children, pl)
			} else {
				top = append(top, pl)
			}
		}
	}
	/*
	for _, pl := range pls {
		pl.SortFolder()
	}
	*/
	if root == nil {
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
	return nil, NoSuchPlaylistFolder
}

func (db *DB) Genres() ([]*Genre, error) {
	qs := `SELECT genre, sort_genre, COUNT(*) FROM track WHERE genre IS NOT NULL GROUP BY sort_genre, genre`
	rows, err := db.Query(qs)
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
			return nil, err
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

func (db *DB) getArtists(col string, genre *Genre) (map[string]*Artist, error) {
	qs := fmt.Sprintf(`SELECT %s, %s, COUNT(*) FROM track WHERE %s IS NOT NULL`, pq.QuoteIdentifier(col), pq.QuoteIdentifier("sort_" + col), pq.QuoteIdentifier(col))
	args := []interface{}{}
	if genre != nil {
		qs += " AND sort_genre = ?"
		args = append(args, genre.SortName)
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
			return nil, err
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
			return nil, err
		}
		artist.Names[a] = c
	}
	return artist, nil
}

func (db *DB) SearchArtist(name string, s Search) (*Artist, error) {
	sort_name := MakeSortArtist(name)
	cols := []string{
		"artist",
		"album_artist",
		"composer",
	}
	var artist *Artist
	for _, col := range cols {
		art, err := db.searchArtist(col, sort_name, s)
		if err != nil {
			return nil, err
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
		var g, sg string
		var c int
		err = rows.Scan(&g, &sg, &c)
		if err != nil {
			return nil, err
		}
		genre, ok := gmap[sg]
		if ok {
			genre.Names[g] += c
		} else {
			genre = &Genre{
				SortName: sg,
				Names: map[string]int{g: c},
				db: db,
			}
			gmap[sg] = genre
			keys = append(keys, sg)
		}
	}
	genres := make([]*Genre, len(keys))
	for i, key := range keys {
		genres[i] = gmap[key]
	}
	return genres, nil
}

func (db *DB) Artists() ([]*Artist, error) {
	return db.GenreArtists(nil)
}

func (db *DB) GenreArtists(genre *Genre) ([]*Artist, error) {
	qs := `SELECT (CASE album_artist WHEN NULL THEN artist ELSE album_artist END) AS art, (CASE album_artist WHEN NULL THEN sort_artist ELSE sort_album_artist END) AS sart, COUNT(*) FROM track`
	args := []interface{}{}
	if genre != nil {
		qs += ` WHERE sort_genre = ?`
		args = append(args, genre.SortName)
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
			return nil, err
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

func (db *DB) GetAlbums(artist *Artist, genre *Genre) ([]*Album, error) {
	qs := `SELECT album_artist, sort_album_artist, artist, sort_artist, album, sort_album, COUNT(*) FROM track WHERE album IS NOT NULL`
	args := []interface{}{}
	if artist != nil {
		qs += " AND (sort_artist = ? OR sort_album_artist = ?)"// OR sort_composer = ?)"
		args = append(args, artist.SortName, artist.SortName)//, artist.SortName)
	}
	if genre != nil {
		qs += " AND sort_genre = ?"
		args = append(args, genre.SortName)
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
			return nil, err
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

func (db *DB) Albums() ([]*Album, error) {
	return db.GetAlbums(nil, nil)
}

func (db *DB) ArtistAlbums(artist *Artist) ([]*Album, error) {
	return db.GetAlbums(artist, nil)
}

func (db *DB) GenreAlbums(genre *Genre) ([]*Album, error) {
	return db.GetAlbums(nil, genre)
}

func (db *DB) AlbumTracks(album *Album) ([]*Track, error) {
	qs := `SELECT * FROM track WHERE sort_album = ?`
	args := []interface{}{album.SortName}
	if album.Artist != nil {
		qs += ` AND ((sort_album_artist IS NULL AND sort_artist = ?) OR sort_album_artist = ?)`
		args = append(args, album.Artist.SortName, album.Artist.SortName)
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
			return nil, err
		}
		tracks = append(tracks, &track)
	}
	return tracks, nil
}

func (db *DB) ArtistTracks(artist *Artist) ([]*Track, error) {
	qs := `SELECT * FROM track WHERE sort_artist = ? OR sort_album_artist = ? OR sort_composer = ? ORDER BY sort_album_artist, sort_album, disc_number, track_number, sort_name`
	rows, err := db.Query(qs, artist.SortName, artist.SortName, artist.SortName)
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

func (db *DB) GenreTracks(genre *Genre) ([]*Track, error) {
	qs := `SELECT * FROM track WHERE sort_genre = ? ORDER BY sort_album_artist, sort_album, disc_number, track_number, sort_name`
	rows, err := db.Query(qs, genre.SortName)
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
	qs := `SELECT track.* FROM playlist_track, track WHERE playlist_track.playlist_id = ? AND playlist_track.track_id = track.id ORDER BY playlist_track.position`
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

func (db *DB) PlaylistTrackIDs(pl *Playlist) ([]PersistentID, error) {
	qs := `SELECT track_id AS id FROM playlist_track WHERE playlist_id = ? ORDER BY playlist_track.position`
	rows, err := db.Query(qs, pl.PersistentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := []PersistentID{}
	for rows.Next() {
		var pid PersistentID
		err = rows.Scan(&pid)
		if err != nil {
			return nil, err
		}
		ids = append(ids, pid)
	}
	return ids, nil
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

func (db *DB) SmartTracks(spl *Smart) ([]*Track, error) {
	maxs := int64(math.MaxInt64)
	maxt := int64(math.MaxInt64)
	where, args := spl.RuleSet.Where()
	var qs string
	if db.hasPlaylistRule(spl.RuleSet) {
		qs = `SELECT DISTINCT track.* FROM track, playlist_track WHERE track.id = playlist_track.track_id AND track.location IS NOT NULL AND (` + where + ")"
	} else {
		qs = `SELECT * FROM track WHERE track.location IS NOT NULL AND (` + where + ")"
	}
	if spl.Limit != nil {
		qs += spl.Limit.Order()
		if spl.Limit.MaxSize != nil {
			maxs = int64(*spl.Limit.MaxSize)
		}
		if spl.Limit.MaxTime != nil {
			maxt = int64(*spl.Limit.MaxTime)
		}
	}
	log.Println("SmartTracks:", qs, args)
	rows, err := db.Query(qs, args...)
	if err != nil {
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
		if i % 100 == 0 {
			log.Printf("%d tracks...", i)
		}
	}
	log.Printf("%d tracks", len(tracks))
	return tracks, nil
}

type IDable interface {
	ID() PersistentID
	SetID(PersistentID)
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
		tag := strings.Split(f.Tag.Get("db"), ",")[0]
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
		tag := strings.Split(f.Tag.Get("db"), ",")[0]
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
	_, err := tx.Exec(qs, vals...)
	return err
}

func (db *DB) saveStruct(tx *Tx, obj IDable) error {
	if obj.ID() == PersistentID(0) {
		obj.SetID(NewPersistentID())
		err := db.insertStruct(tx, obj)
		if err != nil {
			obj.SetID(PersistentID(0))
			return err
		}
		return nil
	}
	return db.updateStruct(tx, obj)
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
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.saveStruct(tx, playlist)
	if err != nil {
		tx.Rollback()
		return err
	}
	parent := playlist
	for parent.ParentPersistentID != nil {
		if *parent.ParentPersistentID == playlist.PersistentID {
			tx.Rollback()
			return CircularPlaylistFolder
		}
		parent, err = db.GetPlaylist(*parent.ParentPersistentID)
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

func (db *DB) DeleteTrackFromPlaylist(playlist *Playlist, trid PersistentID) error {
	return db.DeleteTracksFromPlaylist(playlist, []PersistentID{trid})
}

func (db *DB) DeleteTracksFromPlaylist(playlist *Playlist, trids []PersistentID) error {
	trackIds, err := db.PlaylistTrackIDs(playlist)
	if err != nil {
		return err
	}
	delIds := map[PersistentID]bool{}
	for _, id := range trids {
		delIds[id] = true
	}
	dirty := false
	saveIds := make([]PersistentID, 0, len(trackIds))
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
	TrackID PersistentID
	Position int
}

func (db *DB) DeleteTrackFromPlaylistAt(playlist *Playlist, trid PersistentID, pos int) error {
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
	delIds := make([]*PersistentID, len(trackIds))
	for _, ref := range refs {
		if ref.Position >= len(delIds) {
			continue
		}
		delIds[ref.Position] = &ref.TrackID
	}
	dirty := false
	saveIds := make([]PersistentID, 0, len(trackIds))
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
	qs := `DELETE FROM playlist_track WHERE track_id = ?`
	_, err = tx.Exec(qs, tr.PersistentID)
	if err != nil {
		tx.Rollback()
		return err
	}
	qs = `DELETE FROM track WHERE id = ?`
	_, err = tx.Exec(qs, tr.PersistentID)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (db *DB) DeletePlaylist(pl *Playlist) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	qs := `DELETE FROM playlist_track WHERE playlist_id = ?`
	_, err = tx.Exec(qs, pl.PersistentID)
	if err != nil {
		tx.Rollback()
		return err
	}
	qs = `DELETE FROM playlist WHERE id = ?`
	_, err = tx.Exec(qs, pl.PersistentID)
	if err != nil {
		tx.Rollback()
		return err
	}
	qs = `SELECT COUNT(*) FROM playlist WHERE parent_id = ?`
	row := tx.QueryRow(qs, pl.PersistentID)
	var c int
	err = row.Scan(&c)
	if err != nil {
		tx.Rollback()
		return err
	}
	if c != 0 {
		tx.Rollback()
		return PlaylistFolderNotEmpty
	}
	return tx.Commit()
}

func (db *DB) UpdateITunesTrack(tr *loader.Track) error {
	if tr.PersistentID == nil {
		return errors.New("track has no persistent id")
	}
	xtr := tr.Clone()
	xtr.TrackID = nil
	id := PersistentID(*tr.PersistentID).String()
	qs := `SELECT data FROM itunes_track WHERE id = ?`
	row := db.QueryRow(qs, id)
	var data []byte
	err := row.Scan(&data)
	if err != nil {
		if err == sql.ErrNoRows {
			track := TrackFromITunes(tr)
			track.Validate()
			tx, err := db.Begin()
			if err != nil {
				return err
			}
			err = db.insertStruct(tx, track)
			if err != nil {
				log.Printf("difficulty with track %s", track.PersistentID.String())
				tx.Rollback()
				return err
			}
			qs = `INSERT INTO itunes_track (id, data, mod_date) VALUES(?, ?, ?)`
			_, err = tx.Exec(qs, id, serializeGob(tr), time.Now().In(time.UTC))
			if err != nil {
				tx.Rollback()
				log.Println("erorr %s in %s", err.Error(), qs)
				return err
			}
			return tx.Commit()
		}
		return err
	}
	mydata := serializeGob(xtr)
	if bytes.Equal(data, mydata) {
		return nil
	}
	qs = `SELECT * FROM track WHERE id = ?`
	row = db.QueryRow(qs, PersistentID(*tr.PersistentID))
	track := &Track{}
	err = row.StructScan(track)
	if err != nil {
		if err == sql.ErrNoRows {
			// track was deleted
			return nil
		}
		return err
	}
	orig := &loader.Track{}
	err = deserializeGob(data, orig)
	if err != nil {
		return err
	}
	track.Update(TrackFromITunes(orig), TrackFromITunes(tr))
	track.Validate()
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.updateStruct(tx, track)
	if err != nil {
		log.Printf("difficulty with track %s", track.PersistentID.String())
		tx.Rollback()
		return err
	}
	qs = `UPDATE itunes_track SET data = ?, mod_date = ? WHERE id = ?`
	_, err = tx.Exec(qs, mydata, time.Now().In(time.UTC), id)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (db *DB) UpdateITunesPlaylist(pl *loader.Playlist) error {
	if pl.PersistentID == nil {
		return errors.New("playlist has no persistent id")
	}
	id := PersistentID(*pl.PersistentID).String()
	qs := `SELECT data FROM itunes_playlist WHERE id = ?`
	row := db.QueryRow(qs, id)
	var data []byte
	err := row.Scan(&data)
	if err != nil {
		if err == sql.ErrNoRows {
			playlist := PlaylistFromITunes(pl)
			tx, err := db.Begin()
			if err != nil {
				return err
			}
			err = db.insertStruct(tx, playlist)
			if err != nil {
				log.Printf("difficulty with playlist %s", playlist.PersistentID.String())
				tx.Rollback()
				return err
			}
			err = db.savePlaylistTracksWithTx(playlist, tx)
			if err != nil {
				tx.Rollback()
				return err
			}
			qs = `INSERT INTO itunes_playlist (id, data, mod_date) VALUES(?, ?, ?)`
			_, err = tx.Exec(qs, id, serializeGob(pl), time.Now().In(time.UTC))
			if err != nil {
				tx.Rollback()
				return err
			}
			return tx.Commit()
		}
		return err
	}
	mydata := serializeGob(pl)
	if bytes.Equal(data, mydata) {
		return nil
	}
	qs = `SELECT * FROM playlist WHERE id = ?`
	row = db.QueryRow(qs, PersistentID(*pl.PersistentID))
	playlist := &Playlist{}
	err = row.StructScan(playlist)
	if err != nil {
		if err == sql.ErrNoRows {
			// playlist was deleted
			return nil
		}
		return err
	}
	playlist.TrackIDs, err = db.PlaylistTrackIDs(playlist)
	if err != nil {
		return err
	}
	orig := &loader.Playlist{}
	err = deserializeGob(data, orig)
	if err != nil {
		return err
	}
	playlist.Update(PlaylistFromITunes(orig), PlaylistFromITunes(pl))
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	err = db.updateStruct(tx, playlist)
	if err != nil {
		log.Printf("difficulty with playlist %s", playlist.PersistentID.String())
		tx.Rollback()
		return err
	}
	err = db.savePlaylistTracksWithTx(playlist, tx)
	if err != nil {
		tx.Rollback()
		return err
	}
	qs = `UPDATE itunes_playlist SET data = ?, mod_date = ? WHERE id = ?`
	_, err = tx.Exec(qs, mydata, time.Now().In(time.UTC), id)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

