package itunes

import (
	"encoding/xml"
	"strconv"
	"strings"
	"time"
)

type Playlist struct {
	Master *bool `json:"master,omitempty"`
	PlaylistID *int `json:"playlist_id,omitempty"`
	PlaylistPersistentID *string `json:"persistent_id,omitempty"`
	AllItems *bool `json:"all_items,omitempty"`
	Visible *bool `json:"visible,omitempty"`
	Name *string `json:"name,omitempty"`
	PlaylistItems []*Track `json:"items,omitempty"`
	DistinguishedKind *int `json:"distinguished_kind,omitempty"`
	Music *bool `json:"music,omitempty"`
	SmartInfo []byte `json:"-"`
	SmartCriteria []byte `json:"-"`
	Smart *SmartPlaylist `json:"smart,omitempty"`
	Movies *bool `json:"movies,omitempty"`
	TVShows *bool `json:"tv_shows,omitempty"`
	Podcasts *bool `json:"podcasts,omitempty"`
	Audiobooks *bool `json:"audiobooks,omitempty"`
	PurchasedMusic *bool `json:"purchased,omitempty"`
	Folder *bool `json:"folder,omitempty"`
	ParentPersistentID *string `json:"parent_persistent_id,omitempty"`
	GeniusTrackID *int `json:"genius_track_id,omitempty"`
	Children []*Playlist `json:"children,omitempty"`
}

func NewPlaylist() *Playlist {
	p := &Playlist{}
	p.PlaylistItems = make([]*Track, 0)
	p.Children = make([]*Playlist, 0)
	return p
}

func (p *Playlist) Prune() *Playlist {
	clone := *p
	clone.PlaylistItems = nil
	clone.Children = make([]*Playlist, len(p.Children))
	for i, child := range p.Children {
		clone.Children[i] = child.Prune()
	}
	return &clone
}

func (p *Playlist) IsSystemPlaylist() bool {
	if p.Master != nil && *p.Master {
		return true
	}
	if p.Music != nil && *p.Music {
		return true
	}
	if p.Movies != nil && *p.Movies {
		return true
	}
	if p.TVShows != nil && *p.TVShows {
		return true
	}
	if p.Podcasts != nil && *p.Podcasts {
		return true
	}
	if p.Audiobooks != nil && *p.Audiobooks {
		return true
	}
	if p.PurchasedMusic != nil && *p.PurchasedMusic {
		return true
	}
	if p.SmartInfo != nil && len(p.SmartInfo) > 0 && *p.Name == "Downloaded" {
		return true
	}
	return false
}

func (p *Playlist) Set(key []byte, kind string, val []byte) {
	SetField(p, key, kind, val)
}

func (p *Playlist) AddTrack(t *Track) {
	p.PlaylistItems = append(p.PlaylistItems, t)
}

func (p *Playlist) DescendantCount() int {
	i := 0
	if p.Folder == nil || *p.Folder == false {
		i++
	}
	for _, c := range p.Children {
		i += c.DescendantCount()
	}
	return i
}

func (p *Playlist) TotalTime() time.Duration {
	var t time.Duration
	t = 0
	for _, track := range p.PlaylistItems {
		if track.TotalTime != nil {
			t += time.Duration(*track.TotalTime) * time.Millisecond
		}
	}
	return t
}

func (p *Playlist) GetByName(name string) *Playlist {
	for _, c := range p.Children {
		if c.Name != nil && *c.Name == name {
			return c
		}
	}
	return nil
}

func (p *Playlist) FindByName(name string) []*Playlist {
	matches := make([]*Playlist, 0)
	for _, c := range p.Children {
		if c.Name != nil && *c.Name == name {
			matches = append(matches, c)
		}
		matches = append(matches, c.FindByName(name)...)
	}
	return matches
}

func (p *Playlist) GetByPath(path string) *Playlist {
	parts := strings.Split(path, "/")
	f := p.GetByName(parts[0])
	if f == nil {
		return nil
	}
	if len(parts) == 1 {
		return f
	}
	return f.GetByPath(strings.Join(parts[1:], "/"))
}


func (p *Playlist) Parse(dec *xml.Decoder, idx *TrackIDIndex) error {
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
						id, _ := strconv.Atoi(string(val))
						t := idx.Get(id)
						if t != nil {
							p.AddTrack(t)
						}
					}
				} else {
					p.Set(key, se.Name.Local, val)
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

