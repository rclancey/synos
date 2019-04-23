package main

import (
	"log"
	"net/http"
	//"regexp"
	//"sort"
	//"strings"

	"itunes"
)

/*
var aAnThe = regexp.MustCompile(`^(a|an|the) `)
var nonAlpha = regexp.MustCompile(`[^a-z0-9]+`)
var spaces = regexp.MustCompile(`\s+`)
var nums = regexp.MustCompile(`(\D*)(\d*)`)

type SortableTable map[string]map[string]int

func (st SortableTable) Add(name, sname *string) {
	if name == nil {
		return
	}
	v := *name
	var k string
	if sname == nil {
		k = makeKey(v)
	} else {
		k = makeKey(*sname)
	}
	if k == "" {
		return
	}
	m, ok := st[k]
	if !ok {
		m = map[string]int{v: 1}
		st[k] = m
	} else {
		st[k][v] = st[k][v] + 1
	}
}

type ValFreq struct {
	Val string
	Freq int
}

type SortableValFreq []ValFreq

func (svf SortableValFreq) Len() int { return len(svf) }
func (svf SortableValFreq) Swap(i, j int) { svf[i], svf[j] = svf[j], svf[i] }
func (svf SortableValFreq) Less(i, j int) bool { return svf[i].Freq > svf[j].Freq }

func (st SortableTable) Values() []string {
	keys := make([]string, len(st))
	i := 0
	for k := range st {
		keys[i] = k
		i += 1
	}
	sort.Strings(keys)
	values := make([]string, len(keys))
	for i, k := range keys {
		m := st[k]
		vals := make([]ValFreq, len(m))
		j := 0
		for v, f := range m {
			vals[j] = ValFreq{Val: v, Freq: f}
			j += 1
		}
		sort.Sort(SortableValFreq(vals))
		values[i] = vals[0].Val
	}
	return values
}

func makeKey(v string) string {
	s := strings.ToLower(v)
	s = nums.ReplaceAllString(s, " $1 ")
	s = aAnThe.ReplaceAllString(s, "")
	s = nonAlpha.ReplaceAllString(s, "")
	s = spaces.ReplaceAllString(s, " ")
	s = aAnThe.ReplaceAllString(s, "")
	s = strings.TrimSpace(s)
	return s
}

func sortMapVals(m map[string]string) []string {
	keys := make([]string, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i += 1
	}
	sort.Strings(keys)
	vals := make([]string, len(keys))
	for i, k := range keys {
		vals[i] = m[k]
	}
	return vals
}
*/

func ListGenres(w http.ResponseWriter, req *http.Request) {
	/*
	genreMap := SortableTable{}
	for _, t := range lib.Tracks {
		genreMap.Add(t.Genre, nil)
	}
	SendJSON(w, genreMap.Values())
	*/
	SendJSON(w, lib.GenreIndex)
}

/*
func inGenre(genre string, t *itunes.Track) bool {
	if genre == "" {
		return true
	}
	if t.Genre != nil && makeKey(*t.Genre) == genre {
		return true
	}
	return false
}
*/

func ListArtists(w http.ResponseWriter, req *http.Request) {
	genre := itunes.MakeKey(req.URL.Query().Get("genre"))
	/*
	artistMap := SortableTable{}
	for _, t := range lib.Tracks {
		if inGenre(genre, t) {
			artistMap.Add(t.Artist, t.SortArtist)
			artistMap.Add(t.AlbumArtist, t.SortAlbumArtist)
		}
	}
	SendJSON(w, artistMap.Values())
	*/
	SendJSON(w, lib.ArtistIndex[genre])
}

/*
func byArtist(artist string, t *itunes.Track) bool {
	if t.Artist != nil && makeKey(*t.Artist) == artist {
		return true
	}
	if t.SortArtist != nil && makeKey(*t.SortArtist) == artist {
		return true
	}
	if t.AlbumArtist != nil && makeKey(*t.AlbumArtist) == artist {
		return true
	}
	if t.SortAlbumArtist != nil && makeKey(*t.SortAlbumArtist) == artist {
		return true
	}
	if t.Composer != nil && makeKey(*t.Composer) == artist {
		return true
	}
	if t.SortComposer != nil && makeKey(*t.SortComposer) == artist {
		return true
	}
	return false
}

func onAlbum(artist, album string, t *itunes.Track) bool {
	if !byArtist(artist, t) {
		return false
	}
	if album == "" {
		return true
	}
	if t.Album != nil && makeKey(*t.Album) == album {
		return true
	}
	if t.SortAlbum != nil && makeKey(*t.SortAlbum) == album {
		return true
	}
	return false
}
*/

func ListAlbums(w http.ResponseWriter, req *http.Request) {
	genre := itunes.MakeKey(req.URL.Query().Get("genre"))
	artist := itunes.MakeKey(req.URL.Query().Get("artist"))
	/*
	albumMap := SortableTable{}
	for _, t := range lib.Tracks {
		if byArtist(artist, t) {
			albumMap.Add(t.Album, t.SortAlbum)
		}
	}
	SendJSON(w, albumMap.Values())
	*/
	SendJSON(w, lib.AlbumIndex[itunes.AlbumKey{genre, artist}])
}

/*
type sortableAlbum []*itunes.Track
func (sa sortableAlbum) Len() int { return len(sa) }
func (sa sortableAlbum) Swap(i, j int) { sa[i], sa[j] = sa[j], sa[i] }
func (sa sortableAlbum) Less(i, j int) bool {
	var ad, at, bd, bt int
	var an, bn string
	if sa[i].DiscNumber != nil {
		ad = *sa[i].DiscNumber
	}
	if sa[j].DiscNumber != nil {
		bd = *sa[j].DiscNumber
	}
	if ad < bd {
		return true
	}
	if ad > bd {
		return false
	}
	if sa[i].TrackNumber != nil {
		at = *sa[i].TrackNumber
	}
	if sa[j].TrackNumber != nil {
		bt = *sa[j].TrackNumber
	}
	if at < bt {
		return true
	}
	if at > bt {
		return false
	}
	if sa[i].Name != nil {
		an = makeKey(*sa[i].Name)
	}
	if sa[j].Name != nil {
		bn = makeKey(*sa[j].Name)
	}
	return strings.Compare(an, bn) < 0
}
*/

func ListSongs(w http.ResponseWriter, req *http.Request) {
	q := req.URL.Query()
	artist := itunes.MakeKey(q.Get("artist"))
	album := itunes.MakeKey(q.Get("album"))
	log.Println("artist:", artist, "album:", album)
	/*
	tracks := []*itunes.Track{}
	for _, t := range lib.Tracks {
		if onAlbum(artist, album, t) {
			tracks = append(tracks, t)
		}
	}
	sort.Sort(sortableAlbum(tracks))
	SendJSON(w, tracks)
	*/
	SendJSON(w, lib.SongIndex[itunes.SongKey{artist, album}])
}
