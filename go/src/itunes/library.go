package itunes

import (
	//"encoding/json"
	"encoding/xml"
	"io"
	//"io/ioutil"
	"log"
	"math/rand"
	"os"
	//"sort"
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
	Tracks map[PersistentID]*Track
	Playlists map[PersistentID]*Playlist
	PlaylistTree []*Playlist
	trackIDIndex map[int]PersistentID
}

func NewLibrary(finder *FileFinder) *Library {
	lib := &Library{}
	lib.Tracks = map[PersistentID]*Track{}
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
					lib.Tracks[track.PersistentID] = track
					if track.TrackID != nil {
						lib.trackIDIndex[*track.TrackID] = track.PersistentID
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
					lib.Playlists[playlist.PlaylistPersistentID] = playlist
					playlist.Nest(lib)
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
	track := &Track{}
	err := track.Parse(dec, id)
	if err != nil {
		return nil, err
	}
	return track, nil
}

func (lib *Library) ParsePlaylist(dec *xml.Decoder) (*Playlist, error) {
	playlist := &Playlist{}
	err := playlist.Parse(dec, lib)
	if err != nil {
		return nil, err
	}
	if playlist.Folder != nil && *playlist.Folder {
		playlist.TrackIDs = nil
	}
	playlist.MakeSmart()
	return playlist, nil
}

func (lib *Library) FindPlaylists(name string) []*Playlist {
	playlists := make([]*Playlist, 0)
	for _, p := range lib.Playlists {
		if p.Name != nil && *p.Name == name {
			playlists = append(playlists, p)
		}
	}
	return playlists
}

func (lib *Library) GetPlaylistByPath(path string) *Playlist {
	parts := strings.Split(path, "/")
	for _, p := range lib.PlaylistTree {
		if p.Name != nil {
			if *p.Name == path {
				return p
			}
			if *p.Name == parts[0] {
				m := p.GetByPath(strings.Join(parts[1:], "/"))
				if m != nil {
					return m
				}
			}
		}
	}
	return nil
}

func (lib *Library) CreatePlaylist(name string, parentId *PersistentID) *Playlist {
	tru := true
	p := &Playlist{
		PlaylistPersistentID: PersistentID(rand.Uint64()),
		ParentPersistentID: parentId,
		Name: &name,
		AllItems: &tru,
		TrackIDs: []PersistentID{},
	}
	lib.Playlists[p.PlaylistPersistentID] = p
	p.Nest(lib)
	return nil
}

func (lib *Library) TrackList() *TrackList {
	tracks := make([]*Track, len(lib.Tracks))
	i := 0
	for _, tr := range lib.Tracks {
		tracks[i] = tr
		i += 1
	}
	tl := TrackList(tracks)
	return &tl
}

