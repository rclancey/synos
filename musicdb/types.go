package musicdb

import (
	"sort"
)

type sortableNames struct {
    m map[string]int
    keys []string
}

func (sn *sortableNames) Len() int { return len(sn.keys) }
func (sn *sortableNames) Swap(i, j int) { sn.keys[i], sn.keys[j] = sn.keys[j], sn.keys[i] }
func (sn *sortableNames) Less(i, j int) bool { return sn.m[sn.keys[j]] < sn.m[sn.keys[i]] }

func sortNames(names map[string]int) []string {
	sn := &sortableNames{m: names}
    sn.keys = make([]string, len(sn.m))
    i := 0
    for k := range sn.m {
        sn.keys[i] = k
        i += 1
    }
    sort.Sort(sn)
    return sn.keys
}

type Genre struct {
	SortName string `json:"sort"`
	Names map[string]int `json:"names"`
	db *DB
}

func (g *Genre) Sorted() []string {
	return sortNames(g.Names)
}

type Artist struct {
	SortName string `json:"sort"`
	Names map[string]int `json:"names"`
	db *DB
}

func (a *Artist) Sorted() []string {
	return sortNames(a.Names)
}

func (a *Artist) Count() int {
	count := 0
	for _, v := range a.Names {
		count += v
	}
	return count
}

type Album struct {
	Artist *Artist `json:"artist"`
	SortName string `json:"sort"`
	Names map[string]int `json:"names"`
	db *DB
}

func (a *Album) Sorted() []string {
	return sortNames(a.Names)
}

func (a *Album) Count() int {
	count := 0
	for _, v := range a.Names {
		count += v
	}
	return count
}

func NewGenre(name string) *Genre {
	if name == "" {
		return nil
	}
	return &Genre{SortName: MakeSort(name)}
}

func NewArtist(name string) *Artist {
	if name == "" {
		return nil
	}
	return &Artist{SortName: MakeSortArtist(name)}
}

func NewAlbum(name string, artist *Artist) *Album {
	if name == "" || artist == nil {
		return nil
	}
	return &Album{SortName: MakeSort(name), Artist: artist}
}

type SortableGenreList []*Genre
type SortableArtistList []*Artist
type SortableAlbumList []*Album

func (s SortableGenreList) Len() int { return len(s) }
func (s SortableArtistList) Len() int { return len(s) }
func (s SortableAlbumList) Len() int { return len(s) }

func (s SortableGenreList) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s SortableArtistList) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s SortableAlbumList) Swap(i, j int) { s[i], s[j] = s[j], s[i] }

func (s SortableGenreList) Less(i, j int) bool { return s[i].SortName < s[j].SortName }
func (s SortableArtistList) Less(i, j int) bool { return s[i].SortName < s[j].SortName }
func (s SortableAlbumList) Less(i, j int) bool { return s[i].SortName < s[j].SortName }
