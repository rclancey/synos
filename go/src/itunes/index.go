package itunes

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
)

type TrackIDIndex struct {
	ix map[int]*Track
}

func NewTrackIDIndex() *TrackIDIndex {
	ti := &TrackIDIndex{}
	ti.ix = make(map[int]*Track)
	return ti
}

func (ti *TrackIDIndex) Add(t *Track) {
	ti.ix[t.ID] = t
}

func (ti *TrackIDIndex) Get(id int) *Track {
	t, ok := ti.ix[id]
	if ok {
		return t
	}
	return nil
}

type TrackIndex struct {
	ix map[string][]*Track
	values int
}

func NewTrackIndex() *TrackIndex {
	ti := &TrackIndex{}
	ti.values = 0
	ti.ix = make(map[string][]*Track)
	return ti
}

func (ti *TrackIndex) Add(t *Track) {
	words := make(map[string]bool)
	ti.addWords(words, t.Name)
	ti.addWords(words, t.Artist)
	ti.addWords(words, t.AlbumArtist)
	ti.addWords(words, t.Album)
	ti.addWords(words, t.Comments)
	ti.addWords(words, t.Composer)
	ti.addWords(words, t.Episode)
	ti.addWords(words, t.Genre)
	ti.addWords(words, t.Grouping)
	ti.addWords(words, t.Kind)
	ti.addWords(words, t.Series)
	for word := range words {
		_, ok := ti.ix[word]
		if !ok {
			ti.ix[word] = make([]*Track, 0, 1)
		}
		ti.ix[word] = append(ti.ix[word], t)
	}
	ti.values++
}

func (ti *TrackIndex) Keys() int {
	return len(ti.ix)
}

func (ti *TrackIndex) Values() int {
	return ti.values
}

func (ti *TrackIndex) addWords(words map[string]bool, s *string) {
	if s == nil {
		return
	}
	parts := strings.Split(strings.ToLower(*s), " ")
	for _, word := range parts {
		if word != "" {
			words[word] = true
		}
	}
}

func (ti *TrackIndex) Search(query string) []*Track {
	fmt.Printf("search for '%s'\n", query)
	words := strings.Split(strings.ToLower(query), " ")
	startIndex := 0
	for i, word := range words {
		if word == "" {
			continue
		}
		startIndex = i
		break
	}
	retval := make([]*Track, 0)
	//fmt.Printf("search for '%s'\n", words[startIndex])
	matches, ok := ti.ix[words[startIndex]]
	if !ok {
		fmt.Printf("term '%s' not in index (%d; %d)", words[startIndex], ti.Values(), ti.Keys())
		return retval
	}
	ids := make([]int, 0)
	byId := make(map[int]*Track)
	for _, t := range matches {
		byId[t.ID] = t
		ids = append(ids, t.ID)
	}
	//fmt.Printf("%d matches; %d byId; %d ids\n", len(matches), len(byId), len(ids))
	for _, word := range words[startIndex+1:] {
		if word == "" {
			continue
		}
		//fmt.Printf("filter by '%s'\n", word)
		matches, ok = ti.ix[word]
		if !ok {
			return retval
		}
		xById := make(map[int]*Track)
		for _, t := range matches {
			xById[t.ID] = t
		}
		for _, id := range ids {
			_, ok = xById[id]
			if !ok {
				delete(byId, id)
			}
		}
		ids = make([]int, 0, len(byId))
		for id := range byId {
			ids = append(ids, id)
		}
	}
	retval = make([]*Track, 0, len(ids))
	for _, t := range byId {
		retval = append(retval, t)
	}
	return retval
}

type SortableTable map[string]map[string]int

func (st SortableTable) Add(name, sname *string) {
	if name == nil {
		return
	}
	v := *name
	var k string
	if sname == nil {
		k = MakeKey(v)
	} else {
		k = MakeKey(*sname)
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

func (st SortableTable) Values() [][2]string {
	keys := make([]string, len(st))
	i := 0
	for k := range st {
		keys[i] = k
		i += 1
	}
	sort.Strings(keys)
	values := make([][2]string, len(keys))
	for i, k := range keys {
		m := st[k]
		vals := make([]ValFreq, len(m))
		j := 0
		for v, f := range m {
			vals[j] = ValFreq{Val: v, Freq: f}
			j += 1
		}
		sort.Sort(SortableValFreq(vals))
		values[i] = [2]string{vals[0].Val, k}
	}
	return values
}

var aAnThe = regexp.MustCompile(`^(a|an|the) `)
var nonAlpha = regexp.MustCompile(`[^a-z0-9]+`)
var spaces = regexp.MustCompile(`\s+`)
var nums = regexp.MustCompile(`(\D*)(\d*)`)

func MakeKey(v string) string {
	s := strings.ToLower(v)
	if strings.Contains(s, " feat ") {
		s = strings.Split(s, " feat ")[0]
	} else if strings.Contains(s, " feat. ") {
		s = strings.Split(s, " feat. ")[0]
	} else if strings.Contains(s, " featuring ") {
		s = strings.Split(s, " featuring ")[0]
	} else if strings.Contains(s, " with ") {
		s = strings.Split(s, " with ")[0]
	}
	s = aAnThe.ReplaceAllString(s, "")
	s = nonAlpha.ReplaceAllString(s, "")
	s = nums.ReplaceAllString(s, " $1 ~$2 ")
	s = strings.TrimSpace(s)
	//s = spaces.ReplaceAllString(s, " ")
	//s = aAnThe.ReplaceAllString(s, "")
	//s = strings.TrimSpace(s)
	return s
}

func IndexGenres(lib *Library) [][2]string {
	genreMap := SortableTable{}
	for _, t := range lib.Tracks {
		genreMap.Add(t.Genre, nil)
	}
	return genreMap.Values()
}

func IndexArtists(lib *Library) map[string][][2]string {
	artistIdx := map[string]SortableTable{
		"": SortableTable{},
	}
	var g *string
	var k string
	var st SortableTable
	var ok bool
	es := ""
	for _, t := range lib.Tracks {
		for _, g = range []*string{t.Genre, &es} {
			if g == nil {
				continue
			}
			k = MakeKey(*g)
			st, ok = artistIdx[k]
			if !ok {
				st = SortableTable{}
				artistIdx[k] = st
			}
			st.Add(t.Artist, t.SortArtist)
			st.Add(t.AlbumArtist, t.SortAlbumArtist)
		}
	}
	idx := map[string][][2]string{}
	for k, st = range artistIdx {
		idx[k] = st.Values()
	}
	return idx
}

type AlbumKey struct {
	Genre string
	Artist string
}

func IndexAlbums(lib *Library) map[AlbumKey][][2]string {
	albumIdx := map[AlbumKey]SortableTable{
		AlbumKey{"", ""}: SortableTable{},
	}
	var ap, gp *string
	var a, g string
	var k AlbumKey
	var st SortableTable
	var ok bool
	es := ""
	for _, t := range lib.Tracks {
		for _, gp = range []*string{t.Genre, &es} {
			if gp == nil {
				continue
			}
			g = MakeKey(*gp)
			for _, ap = range []*string{t.Artist, t.SortArtist, t.AlbumArtist, t.SortAlbumArtist, &es} {
				if ap == nil {
					continue
				}
				a = MakeKey(*ap)
				k = AlbumKey{g, a}
				st, ok = albumIdx[k]
				if !ok {
					st = SortableTable{}
					albumIdx[k] = st
				}
				st.Add(t.Album, t.SortAlbum)
			}
		}
	}
	idx := map[AlbumKey][][2]string{}
	for k, st = range albumIdx {
		idx[k] = st.Values()
	}
	return idx
}

type SongKey struct {
	Artist string
	Album string
}

type sortableAlbum []*Track
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
		an = MakeKey(*sa[i].Name)
	}
	if sa[j].Name != nil {
		bn = MakeKey(*sa[j].Name)
	}
	return strings.Compare(an, bn) < 0
}

func IndexSongs(lib *Library) map[SongKey][]*Track {
	songIdx := map[SongKey][]*Track{}
	var art, alb string
	var artp, albp *string
	var k SongKey
	var used map[SongKey]bool
	var ts []*Track
	var ok bool
	es := ""
	for _, t := range lib.Tracks {
		used = map[SongKey]bool{}
		for _, albp = range []*string{t.Album, t.SortAlbum, &es} {
			if albp == nil {
				continue
			}
			alb = MakeKey(*albp)
			for _, artp = range []*string{t.Artist, t.SortArtist, t.AlbumArtist, t.SortAlbumArtist, &es} {
				if artp == nil {
					continue
				}
				art = MakeKey(*artp)
				k = SongKey{art, alb}
				if _, ok = used[k]; ok {
					continue
				}
				used[k] = true
				ts, ok = songIdx[k]
				if !ok {
					ts = []*Track{}
				}
				songIdx[k] = append(ts, t)
			}
		}
	}
	idx := map[SongKey][]*Track{}
	for k, ts = range songIdx {
		sort.Sort(sortableAlbum(ts))
		idx[k] = ts
	}
	return idx
}
