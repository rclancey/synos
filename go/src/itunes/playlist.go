package itunes

import (
	//"fmt"
	"sort"
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
	if spl[i].Name < spl[j].Name {
		return true
	}
	return false
}

type Playlist struct {
	PlaylistPersistentID PersistentID   `json:"persistent_id,omitempty"`
	ParentPersistentID   *PersistentID  `json:"parent_persistent_id,omitempty"`
	Folder               bool           `json:"folder,omitempty"`
	Name                 string         `json:"name,omitempty"`
	Smart                *SmartPlaylist `json:"smart,omitempty"`
	GeniusTrackID        *PersistentID  `json:"genius_track_id,omitempty"`
	TrackIDs             []PersistentID `json:"track_ids"`
	Children             []*Playlist    `json:"children,omitempty"`
	PlaylistItems        []*Track       `json:"items,omitempty"`
	SortField            string         `json:"sort_field,omitempty"`
}

func NewPlaylist() *Playlist {
	p := &Playlist{}
	p.PlaylistItems = make([]*Track, 0)
	p.Children = make([]*Playlist, 0)
	return p
}

func (p *Playlist) Populate(lib *Library) *Playlist {
	clone := *p
	if p.Smart != nil {
		tl, err := lib.TrackList().SmartFilter(p.Smart, lib)
		if err == nil {
			clone.PlaylistItems = []*Track(*tl)
		}
	} else {
		items := make([]*Track, len(p.TrackIDs))
		for i, id := range p.TrackIDs {
			items[i] = lib.GetTrack(id)
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

func (p *Playlist) AddTrack(t *Track) {
	p.TrackIDs = append(p.TrackIDs, t.PersistentID)
}

func (p *Playlist) DescendantCount() int {
	i := 0
	if p.Folder == false {
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
		if track.TotalTime != 0 {
			t += time.Duration(track.TotalTime) * time.Millisecond
		}
	}
	return t
}

func (p *Playlist) GetByName(name string) *Playlist {
	for _, c := range p.Children {
		if c.Name == name {
			return c
		}
	}
	return nil
}

func (p *Playlist) FindByName(name string) []*Playlist {
	matches := make([]*Playlist, 0)
	for _, c := range p.Children {
		if c.Name == name {
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

func (p *Playlist) Kind() string {
	if p.Folder {
		return "folder"
	}
	if p.GeniusTrackID != nil {
		return "genius"
	}
	if p.Smart != nil {
		return "smart"
	}
	return "playlist"
}

func (p *Playlist) Priority() int {
	switch p.Kind() {
	case "folder":
		return 100
	case "genius":
		return 103
	case "smart":
		return 104
	default:
		return 199
	}
	return 200
}

