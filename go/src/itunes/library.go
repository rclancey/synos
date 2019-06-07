package itunes

import (
	//"encoding/json"
	"encoding/xml"
	"io"
	//"io/ioutil"
	"log"
	"math/rand"
	"os"
	//"runtime"
	"sort"
	"strconv"
	"strings"
	//"time"
)

type Library struct {
	FileName *string
	MajorVersion *int
	MinorVersion *int
	ApplicationVersion *string
	Date *Time
	Features *int
	ShowContentRatings *bool
	PersistentID PersistentID
	MusicFolder *string
	Tracks []*Track
	//Tracks map[PersistentID]*Track
	Playlists map[PersistentID]*Playlist
	PlaylistTree []*Playlist
	trackIDIndex map[int]PersistentID
}

func NewLibrary() *Library {
	lib := &Library{}
	lib.Tracks = make([]*Track, 0)
	//lib.Tracks = map[PersistentID]*Track{}
	lib.Playlists = map[PersistentID]*Playlist{}
	lib.trackIDIndex = map[int]PersistentID{}
	lib.PlaylistTree = []*Playlist{}
	return lib
}

func (lib *Library) Load(fn string) error {
	f, err := os.Open(fn)
	if f != nil {
		defer f.Close()
	}
	if err != nil {
		log.Println("error opening file", err.Error())
		return err
	}
	dec := xml.NewDecoder(f)
	lib.FileName = &fn
	err = lib.Parse(dec)
	lib.trackIDIndex = nil
	if err != nil {
		log.Println("error parsing file", err.Error())
		return err
	}
	if lib.Date == nil {
		st, err := os.Stat(fn)
		if err != nil {
			return err
		}
		lib.Date = &Time{}
		lib.Date.Set(st.ModTime())
	}
	return nil
}

func (lib *Library) Set(key []byte, kind string, val []byte) {
	SetField(lib, key, kind, val)
}

func (lib *Library) Parse(dec *xml.Decoder) error {
	tagStack := make([]string, 0, 10)
	tagStackSize := -1
	key := make([]byte, 0)
	var val []byte
	keyStack := make([]string, 0, 10)
	keyStackSize := -1
	isKey := false
	isVal := false
	for {
		t, err := dec.Token()
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		switch se := t.(type) {
		case xml.StartElement:
			if se.Name.Local == "dict" {
				keyStackSize++
				if len(keyStack) <= keyStackSize {
					keyStack = append(keyStack, "")
				} else {
					keyStack[keyStackSize] = ""
				}
			}
			if se.Name.Local == "key" {
				isKey = true
				key = make([]byte, 0)
			} else if se.Name.Local == "integer" {
				isVal = true
				val = []byte{}
			} else if se.Name.Local == "string" {
				isVal = true
				val = []byte{}
			} else if se.Name.Local == "date" {
				isVal = true
				val = []byte{}
			}
			tagStackSize++
			if len(tagStack) <= tagStackSize {
				tagStack = append(tagStack, se.Name.Local)
			} else {
				tagStack[tagStackSize] = se.Name.Local
			}
			if tagStackSize == 3 && tagStack[0] == "plist" && tagStack[1] == "dict" && tagStack[2] == "dict" && tagStack[3] == "dict" {
				if keyStackSize >= 1 && keyStack[0] == "Tracks" {
					track, err := lib.ParseTrack(dec, key)
					if err != nil {
						return err
					}
					if track != nil {
						id, err := strconv.Atoi(string(key))
						if err != nil {
							return err
						}
						lib.AddTrack(track)
						//lib.Tracks[track.PersistentID] = track
						lib.trackIDIndex[id] = track.PersistentID
					}
					keyStackSize--
					tagStackSize--
				}
			} else if tagStackSize == 3 && tagStack[0] == "plist" && tagStack[1] ==  "dict" && tagStack[2] == "array" && tagStack[3] == "dict" {
				if keyStackSize >= 1 && keyStack[0] == "Playlists" {
					playlist, err := lib.ParsePlaylist(dec)
					if err != nil {
						return err
					}
					if playlist != nil {
						lib.Playlists[playlist.PlaylistPersistentID] = playlist
						playlist.Nest(lib)
					}
					/*
					if playlist.ParentPersistentID != nil {
						parent, ok := lib.PlaylistIDIndex[*playlist.ParentPersistentID]
						if ok {
							parent.Children = append(parent.Children, playlist)
						} else {
							log.Println("warning: parent playlist not found", *playlist.ParentPersistentID)
							lib.Playlists = append(lib.Playlists, playlist)
						}
					} else {
						lib.Playlists = append(lib.Playlists, playlist)
					}
					if playlist.PlaylistPersistentID != nil {
						lib.PlaylistIDIndex[*playlist.PlaylistPersistentID] = playlist
					}
					*/
					keyStackSize--
					tagStackSize--
				}
			}
		case xml.EndElement:
			tagStackSize--
			if tagStackSize == 1 && tagStack[0] == "plist" && tagStack[1] == "dict" {
				lib.Set(key, se.Name.Local, val)
			}
			if se.Name.Local == "key" {
				keyStack[keyStackSize] = string(key)
				isKey = false
			} else if(se.Name.Local == "dict") {
				keyStackSize--
				if keyStackSize == 0 && keyStack[0] == "Playlists" {
					return nil
				}
			} else if se.Name.Local == "integer" {
				isVal = false
			} else if se.Name.Local == "string" {
				isVal = false
			} else if se.Name.Local == "date" {
				isVal = false
			}
		case xml.CharData:
			if isKey {
				key = append(key, []byte(se)...)
			} else if isVal {
				val = append(val, []byte(se)...)
			}
		}
	}
	return nil
}

func (lib *Library) ParseTrack(dec *xml.Decoder, id []byte) (*Track, error) {
	track := &PlistTrack{}
	err := track.Parse(dec, id)
	if err != nil {
		return nil, err
	}
	return track.ToTrack(), nil
}

func (lib *Library) ParsePlaylist(dec *xml.Decoder) (*Playlist, error) {
	playlist := NewPlistPlaylist()
	err := playlist.Parse(dec, lib)
	if err != nil {
		return nil, err
	}
	return playlist.ToPlaylist(), nil
}

func (lib *Library) FindPlaylists(name string) []*Playlist {
	playlists := make([]*Playlist, 0)
	for _, p := range lib.Playlists {
		if p.Name == name {
			playlists = append(playlists, p)
		}
	}
	return playlists
}

func (lib *Library) GetPlaylistByPath(path string) *Playlist {
	parts := strings.Split(path, "/")
	for _, p := range lib.PlaylistTree {
		if p.Name == path {
			return p
		}
		if p.Name == parts[0] {
			m := p.GetByPath(strings.Join(parts[1:], "/"))
			if m != nil {
				return m
			}
		}
	}
	return nil
}

func (lib *Library) CreatePlaylist(name string, parentId *PersistentID) *Playlist {
	p := &Playlist{
		PlaylistPersistentID: PersistentID(rand.Uint64()),
		ParentPersistentID: parentId,
		Name: name,
		TrackIDs: []PersistentID{},
	}
	lib.Playlists[p.PlaylistPersistentID] = p
	p.Nest(lib)
	return nil
}

func (lib *Library) TrackList() *TrackList {
	tl := TrackList(lib.Tracks)
	return &tl
}

type sts []*Track
func (s sts) Len() int { return len(s) }
func (s sts) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s sts) Less(i, j int) bool { return s[i].PersistentID < s[j].PersistentID }

func (lib *Library) AddTrack(tr *Track) {
	id := tr.PersistentID
	f := func(i int) bool {
		return lib.Tracks[i].PersistentID >= id
	}
	idx := sort.Search(len(lib.Tracks), f)
	var tracks []*Track
	//alloced := false
	if len(lib.Tracks) == cap(lib.Tracks) {
		//alloced = true
		tracks = make([]*Track, len(lib.Tracks) + 1, len(lib.Tracks) + 1000)
		for i, x := range lib.Tracks[:idx] {
			tracks[i] = x
		}
		tracks[idx] = tr
		for i, x := range lib.Tracks[idx:] {
			tracks[i+idx+1] = x
		}
	} else {
		tracks = append(lib.Tracks, nil)
		for i := len(lib.Tracks) - 1; i >= idx; i-- {
			tracks[i+1] = tracks[i]
		}
		tracks[idx] = tr
	}
	lib.Tracks = tracks
	/*
	if alloced {
		runtime.GC()
	}
	*/
}

func (lib *Library) GetTrack(id PersistentID) *Track {
	f := func(i int) bool {
		return lib.Tracks[i].PersistentID >= id
	}
	idx := sort.Search(len(lib.Tracks), f)
	if idx < 0 || idx >= len(lib.Tracks) {
		return nil
	}
	tr := lib.Tracks[idx]
	if tr.PersistentID == id {
		return tr
	}
	return nil
}
