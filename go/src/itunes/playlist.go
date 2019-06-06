package itunes

import (
	"encoding/xml"
	"log"
	"sort"
	"strconv"
	"strings"
	"time"
)

type SortablePlaylistList []*Playlist

func (spl SortablePlaylistList) Len() int { return len(spl) }
func (spl SortablePlaylistList) Swap(i, j int) { spl[i], spl[j] = spl[j], spl[i] }
func (spl SortablePlaylistList) Less(i, j int) bool {
	ap := spl[i].Priority()
	bp := spl[j].Priority()
	if ap < bp {
		return true
	}
	if bp > ap {
		return false
	}
	if *spl[i].Name < *spl[j].Name {
		return true
	}
	return false
}

type Playlist struct {
	Master               *bool          `json:"master,omitempty"`
	PlaylistID           *int           `json:"playlist_id,omitempty"`
	PlaylistPersistentID PersistentID   `json:"persistent_id,omitempty"`
	AllItems             *bool          `json:"all_items,omitempty"`
	Visible              *bool          `json:"visible,omitempty"`
	Name                 *string        `json:"name,omitempty"`
	PlaylistItems        []*Track       `json:"items,omitempty"`
	TrackIDs             []PersistentID `json:"-"`
	DistinguishedKind    *int           `json:"distinguished_kind,omitempty"`
	Music                *bool          `json:"music,omitempty"`
	SmartInfo            []byte         `json:"-"`
	SmartCriteria        []byte         `json:"-"`
	Smart                *SmartPlaylist `json:"smart,omitempty"`
	SortField            *string        `json:"sort_field,omitempty"`
	Movies               *bool          `json:"movies,omitempty"`
	TVShows              *bool          `json:"tv_shows,omitempty"`
	Podcasts             *bool          `json:"podcasts,omitempty"`
	Audiobooks           *bool          `json:"audiobooks,omitempty"`
	PurchasedMusic       *bool          `json:"purchased,omitempty"`
	Folder               *bool          `json:"folder,omitempty"`
	ParentPersistentID   *PersistentID  `json:"parent_persistent_id,omitempty"`
	GeniusTrackID        *PersistentID  `json:"genius_track_id,omitempty"`
	Children             []*Playlist    `json:"children,omitempty"`
}

func NewPlaylist() *Playlist {
	p := &Playlist{}
	p.PlaylistItems = make([]*Track, 0)
	p.Children = make([]*Playlist, 0)
	return p
}

func (p *Playlist) Populate(lib *Library) *Playlist {
	clone := *p
	if p.IsSmart() {
		tl, err := lib.TrackList().SmartFilter(p.Smart, lib)
		if err == nil {
			clone.PlaylistItems = []*Track(*tl)
		}
	} else {
		items := make([]*Track, len(p.TrackIDs))
		for i, id := range p.TrackIDs {
			items[i] = lib.Tracks[id]
		}
		clone.PlaylistItems = items
	}
	return &clone
}

func (p *Playlist) Nest(lib *Library) {
	if p.ParentPersistentID != nil {
		parent, ok := lib.Playlists[*p.ParentPersistentID]
		if ok {
			parent.Children = append(parent.Children, p)
			return
		}
	}
	lib.PlaylistTree = append(lib.PlaylistTree, p)
}

func (p *Playlist) Prune() *Playlist {
	clone := *p
	clone.PlaylistItems = nil
	clone.TrackIDs = nil
	clone.Children = make([]*Playlist, len(p.Children))
	for i, child := range p.Children {
		clone.Children[i] = child.Prune()
	}
	sort.Sort(SortablePlaylistList(clone.Children))
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

func (p *Playlist) Kind() string {
	if p.DistinguishedKind != nil {
		k, ok := distKinds[*p.DistinguishedKind]
		if ok {
			return k
		}
	}
	if p.Folder != nil && *p.Folder{
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

func (p *Playlist) Priority() int {
	v, ok := plSort[p.Kind()]
	if !ok {
		return 190
	}
	return v
}

func (p *Playlist) Set(key []byte, kind string, val []byte) {
	SetField(p, key, kind, val)
}

func (p *Playlist) AddTrack(t *Track) {
	p.TrackIDs = append(p.TrackIDs, t.PersistentID)
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

func (p *Playlist) IsSmart() bool {
	if p.Folder != nil && *p.Folder {
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

func (p *Playlist) MakeSmart() error {
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

func (p *Playlist) Parse(dec *xml.Decoder, lib *Library) error {
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

