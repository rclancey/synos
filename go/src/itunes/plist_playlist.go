package itunes

import (
	"encoding/xml"
	//"fmt"
	"log"
	"strconv"
)

type PlistPlaylist struct {
	Playlist
	Master               bool
	Music                bool
	Movies               bool
	TVShows              bool
	Podcasts             bool
	Audiobooks           bool
	PurchasedMusic       bool
	PlaylistID           int
	AllItems             bool
	Visible              *bool
	DistinguishedKind    int
	SmartInfo            []byte
	SmartCriteria        []byte
}

func NewPlistPlaylist() *PlistPlaylist {
	p := &PlistPlaylist{}
	p.TrackIDs = make([]PersistentID, 0)
	return p
}

func (p *PlistPlaylist) Set(key []byte, kind string, val []byte) {
	SetField(p, key, kind, val)
}

func (p *PlistPlaylist) IsSystemPlaylist() bool {
	if p.Master {
		return true
	}
	if p.Music {
		return true
	}
	if p.Movies {
		return true
	}
	if p.TVShows {
		return true
	}
	if p.Podcasts {
		return true
	}
	if p.Audiobooks {
		return true
	}
	if p.PurchasedMusic {
		return true
	}
	if p.SmartInfo != nil && len(p.SmartInfo) > 0 && p.Name == "Downloaded" {
		return true
	}
	return false
}

var distKinds = map[int]string{
	2:  "movies",
	3:  "tvshows",
	4:  "music",
	5:  "audiobooks",
	10: "podcasts",
	19: "purchased",
	65: "downloaded_music",
	66: "downloaded_movies",
	67: "downloaded_tvshows",
}

func (p *PlistPlaylist) Kind() string {
	k, ok := distKinds[p.DistinguishedKind]
	if ok {
		return k
	}
	if p.Folder{
		return "folder"
	}
	if p.GeniusTrackID != nil {
		return "genius"
	}
	if p.SmartInfo != nil && len(p.SmartInfo) > 0 && p.SmartCriteria != nil && len(p.SmartCriteria) > 0 {
		return "smart"
	}
	return "playlist"
}

var plSort = map[string]int {
	"music":              0,
	"movies":             10,
	"tvshows":            20,
	"audiobooks":         30,
	"books":              40,
	"podcasts":           50,
	"downloaded_music":   1,
	"downloaded_movies":  1,
	"downloaded_tvshows": 1,
	"artists":            80,
	"albums":             81,
	"songs":              82,
	"genres":             83,
	"music_videos":       84,

	"folder":             100,
	"purchased":          101,
	"mix":                102,
	"genius":             103,
	"smart":              104,
	"playlist":           199,
}

func (p *PlistPlaylist) Priority() int {
	v, ok := plSort[p.Kind()]
	if !ok {
		return 190
	}
	return v
}

func (p *PlistPlaylist) IsSmart() bool {
	if p.Folder {
		return false
	}
	if p.GeniusTrackID != nil {
		return false
	}
	if p.SmartInfo == nil || p.SmartCriteria == nil {
		return false
	}
	return len(p.SmartInfo) > 0 && len(p.SmartCriteria) > 0
}

func (p *PlistPlaylist) MakeSmart() error {
	if !p.IsSmart() {
		return nil
	}
	s, err := ParseSmartPlaylist(p.SmartInfo, p.SmartCriteria)
	if err != nil {
		log.Println(err)
		return err
	}
	p.TrackIDs = nil
	p.Smart = s
	return nil
}

func (p *PlistPlaylist) Parse(dec *xml.Decoder, lib *Library) error {
	var key, val []byte
	isKey := false
	isVal := false
	isArray := false
	keyStack := make([]string, 1, 5)
	keyStackSize := 0
	keyStack[0] = ""
	for {
		t, err := dec.Token()
		if err != nil {
			return err
		}
		switch se := t.(type) {
		case xml.StartElement:
			if se.Name.Local == "key" {
				isKey = true
				key = []byte{}
			} else if se.Name.Local == "array" {
				isArray = true
			} else if se.Name.Local == "dict" {
				keyStackSize++
				if len(keyStack) <= keyStackSize {
					keyStack = append(keyStack, "")
				}
			} else {
				isVal = true
				val = []byte{}
			}
		case xml.EndElement:
			if se.Name.Local == "key" {
				keyStack[keyStackSize] = string(key)
				isKey = false
			} else if se.Name.Local == "array" {
				isArray = false
			} else if se.Name.Local == "dict" {
				keyStackSize--
				if keyStackSize < 0 {
					return nil
				}
			} else {
				if isArray {
					if se.Name.Local == "integer" && keyStackSize == 1 && keyStack[0] == "Playlist Items" && keyStack[1] == "Track ID" {
						if !p.IsSystemPlaylist() {
							id, _ := strconv.Atoi(string(val))
							pid, ok := lib.trackIDIndex[id]
							if ok {
								p.TrackIDs = append(p.TrackIDs, pid)
							}
						}
					}
				} else {
					if string(key) == "Genius Track ID" {
						id, _ := strconv.Atoi(string(val))
						pid, ok := lib.trackIDIndex[id]
						if ok {
							p.GeniusTrackID = &pid
						}
					} else {
						p.Set(key, se.Name.Local, val)
					}
				}
				isVal = false
			}
		case xml.CharData:
			if isKey {
				key = append(key, []byte(se)...)
			} else if(isVal) {
				val = append(val, []byte(se)...)
			}
		}
	}
	return nil
}

func (p *PlistPlaylist) ToPlaylist() *Playlist {
	if p.Master {
		return nil
	}
	if p.Movies {
		return nil
	}
	if p.TVShows {
		return nil
	}
	if p.Podcasts {
		return nil
	}
	if p.Audiobooks {
		return nil
	}
	if p.PurchasedMusic {
		return nil
	}
	if p.Music {
		return nil
	}
	if p.Visible != nil && !*p.Visible {
		return nil
	}
	if p.Folder {
		p.TrackIDs = nil
	} else if p.SmartInfo != nil && len(p.SmartInfo) > 0 && p.SmartCriteria != nil && len(p.SmartCriteria) > 0 {
		p.MakeSmart()
	}
	pl := p.Playlist
	return &pl
}
