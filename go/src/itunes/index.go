package itunes

import (
	"strings"
	"fmt"
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

