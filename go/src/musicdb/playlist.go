package musicdb

import (
	"bytes"
	"encoding/gob"
	"errors"
	"io"
	"log"
	"sort"
	//"strings"
	//"time"

	"itunes"
	"itunes/loader"
)

type Playlist struct {
	PersistentID         PersistentID   `json:"persistent_id,omitempty" db:"id"`
	ParentPersistentID   *PersistentID  `json:"parent_persistent_id,omitempty" db:"parent_id"`
	Kind                 PlaylistKind   `json:"kind" db:"kind"`
	Folder               bool           `json:"folder,omitempty" db:"folder"`
	Name                 string         `json:"name,omitempty" db:"name"`
	Smart                *Smart         `json:"smart,omitempty" db:"smart"`
	GeniusTrackID        *PersistentID  `json:"genius_track_id,omitempty" db:"genius_track_id"`
	TrackIDs             []PersistentID `json:"track_ids" db:"-"`
	Children             []*Playlist    `json:"children,omitempty" db:"-"`
	PlaylistItems        []*Track       `json:"items,omitempty" db:"-"`
	SortField            string         `json:"sort_field,omitempty" db:"sort_field"`
	db *DB
}

func NewPlaylist() *Playlist {
	p := &Playlist{}
	p.PlaylistItems = make([]*Track, 0)
	p.Children = make([]*Playlist, 0)
	return p
}

func (p *Playlist) ID() PersistentID {
	return p.PersistentID
}

func (p *Playlist) SetID(pid PersistentID) {
	p.PersistentID = pid
}

func (p *Playlist) Serialize(w io.Writer) error {
	if p == nil {
		return errors.New("can't serialize nil playlist")
	}
	xp := *p
	xp.Children = nil
	xp.PlaylistItems = nil
	enc := gob.NewEncoder(w)
	return enc.Encode(&xp)
}

func (p *Playlist) SerializeBytes() ([]byte, error) {
	var buf bytes.Buffer
	err := p.Serialize(&buf)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (p *Playlist) Deserialize(r io.Reader) error {
	dec := gob.NewDecoder(r)
	return dec.Decode(p)
}

func (p *Playlist) DeserializeBytes(data []byte) error {
	buf := bytes.NewBuffer(data)
	return p.Deserialize(buf)
}

func DeserializePlaylist(r io.Reader) (*Playlist, error) {
	pl := &Playlist{}
	err := pl.Deserialize(r)
	if err != nil {
		return nil, err
	}
	return pl, nil
}

func DeserializePlaylistBytes(data []byte) (*Playlist, error) {
	pl := &Playlist{}
	err := pl.DeserializeBytes(data)
	if err != nil {
		return nil, err
	}
	return pl, nil
}

/*
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

func (p *Playlist) Unnest(lib *Library) {
	var orig []*Playlist
	var ppl *Playlist
	var ok bool
	if p.ParentPersistentID == nil {
		orig = lib.PlaylistTree
	} else {
		ppl, ok = lib.Playlists[*p.ParentPersistentID]
		if ok {
			orig = ppl.Children
		} else {
			orig = lib.PlaylistTree
		}
	}
	if orig != nil && len(orig) > 0 {
		children := make([]*Playlist, 0, len(orig) - 1)
		for _, child := range orig {
			if child.PersistentID != p.PersistentID {
				children = append(children, child)
			}
		}
		if ok {
			ppl.Children = children
		} else {
			lib.PlaylistTree = children
		}
	}
}

func (p *Playlist) Move(lib *Library, parentId *PersistentID) error {
	if p.ParentPersistentID == nil && parentId == nil {
		return nil
	}
	if p.ParentPersistentID != nil && parentId != nil && *p.ParentPersistentID == *parentId {
		return nil
	}
	p.Unnest(lib)
	p.ParentPersistentID = parentId
	p.Nest(lib)
	return nil
}

func (p *Playlist) Dedup() {
	if p.Folder || p.GeniusTrackID != nil || p.Smart != nil {
		return
	}
	seen := map[PersistentID]bool{}
	for _, id := range p.TrackIDs {
		if _, ok := seen[id]; ok {
			seen[id] = true
		} else {
			seen[id] = false
		}
	}
	ids := make([]PersistentID, len(seen))
	i := 0
	seen = map[PersistentID]bool{}
	for _, id := range p.TrackIDs {
		if _, ok := seen[id]; !ok {
			ids[i] = id
			i += 1
			seen[id] = true
		}
	}
	p.TrackIDs = ids
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
*/

type SortablePlaylistList []*Playlist
func (spl SortablePlaylistList) Len() int { return len(spl) }
func (spl SortablePlaylistList) Swap(i, j int) {
	log.Printf("swapping %d (%s / %d) and %d (%s / %d)", i, spl[i].Kind, int(spl[i].Kind), j, spl[j].Kind, int(spl[j].Kind))
	spl[i], spl[j] = spl[j], spl[i]
}
func (spl SortablePlaylistList) Less(i, j int) bool {
	ap := int(spl[i].Kind)
	bp := int(spl[j].Kind)
	if ap < bp {
		//log.Printf("%s: %s (%d) < %s: %s (%d)", spl[i].Name, spl[i].Kind, ap, spl[j].Name, spl[j].Kind, bp)
		log.Printf("comparing %d (%s / %s / %d) and %d (%s / %s / %d): true (kind)", i, spl[i].Name, spl[i].Kind, int(spl[i].Kind), j, spl[j].Name, spl[j].Kind, int(spl[j].Kind))
		return true
	}
	if bp > ap {
		//log.Printf("%s: %s (%d) > %s: %s (%d)", spl[i].Name, spl[i].Kind, ap, spl[j].Name, spl[j].Kind, bp)
		log.Printf("comparing %d (%s / %s / %d) and %d (%s / %s / %d): false (kind)", i, spl[i].Name, spl[i].Kind, int(spl[i].Kind), j, spl[j].Name, spl[j].Kind, int(spl[j].Kind))
		return false
	}
	if spl[i].Name < spl[j].Name {
		log.Printf("comparing %d (%s / %s / %d) and %d (%s / %s / %d): true (name)", i, spl[i].Name, spl[i].Kind, int(spl[i].Kind), j, spl[j].Name, spl[j].Kind, int(spl[j].Kind))
		return true
	}
	log.Printf("comparing %d (%s / %s / %d) and %d (%s / %s / %d): false (name)", i, spl[i].Name, spl[i].Kind, int(spl[i].Kind), j, spl[j].Name, spl[j].Kind, int(spl[j].Kind))
	return false
}

func (p *Playlist) SortFolder() {
	if !p.Folder {
		return
	}
	if p.Children == nil {
		return
	}
	sort.Sort(SortablePlaylistList(p.Children))
}

func (p *Playlist) Update(orig, cur *Playlist) (*PersistentID, bool) {
	if p.Folder != cur.Folder {
		return nil, false
	}
	if p.Smart != nil && cur.Smart == nil {
		return nil, false
	}
	if p.Smart != nil {
		if cur.Smart == nil || orig.Smart == nil {
			return nil, false
		}
		sorig := serializeGob(orig.Smart)
		scur := serializeGob(cur.Smart)
		if !bytes.Equal(sorig, scur) {
			p.Smart = cur.Smart
		}
	} else if cur.Smart != nil {
		return nil, false
	}
	if orig.Name != cur.Name {
		p.Name = cur.Name
	}
	tracksDiffer := false
	if len(orig.TrackIDs) != len(cur.TrackIDs) {
		tracksDiffer = true
	} else {
		for i, tid := range cur.TrackIDs {
			if tid != orig.TrackIDs[i] {
				tracksDiffer = true
				break
			}
		}
	}
	if tracksDiffer {
		n1 := len(p.TrackIDs)
		n2 := len(orig.TrackIDs)
		n3 := len(cur.TrackIDs)
		p.TrackIDs, _ = ThreeWayMerge(orig.TrackIDs, cur.TrackIDs, p.TrackIDs)
		log.Printf("three way merge tracks (%d, %d, %d) => %d", n1, n2, n3, len(p.TrackIDs))
	}
	if orig.ParentPersistentID == nil {
		if cur.ParentPersistentID != nil {
			return cur.ParentPersistentID, true
		}
		return nil, false
	}
	if cur.ParentPersistentID == nil {
		return nil, true
	}
	if *orig.ParentPersistentID != *cur.ParentPersistentID {
		return cur.ParentPersistentID, true
	}
	return nil, false
}

func PlaylistFromITunes(ipl *loader.Playlist) *Playlist {
	pl := &Playlist{
		PersistentID: PersistentID(ipl.GetPersistentID()),
		Folder: ipl.GetFolder(),
		Name: ipl.GetName(),
	}
	if ipl.ParentPersistentID != nil {
		pid := PersistentID(*ipl.ParentPersistentID)
		pl.ParentPersistentID = &pid
	}
	if ipl.GeniusTrackID != nil {
		pid := PersistentID(*ipl.GeniusTrackID)
		pl.GeniusTrackID = &pid
	}
	if !pl.Folder {
		if ipl.IsSmart() {
			ispl, err := itunes.ParseSmartPlaylist(ipl.SmartInfo, ipl.SmartCriteria)
			if err == nil {
				pl.Smart = SmartPlaylistFromITunes(ispl)
			}
		} else {
			pl.TrackIDs = make([]PersistentID, len(ipl.TrackIDs))
			for i, uid := range ipl.TrackIDs {
				pl.TrackIDs[i] = PersistentID(uid)
			}
		}
	} else {
		pl.Children = []*Playlist{}
	}
	if ipl.GetMaster() {
		pl.Kind = MasterPlaylist
	} else if ipl.GetMusic() {
		pl.Kind = MusicPlaylist
	} else if ipl.GetMovies() {
		pl.Kind = MoviesPlaylist
	} else if ipl.GetTVShows() {
		pl.Kind = TVShowsPlaylist
	} else if ipl.GetPodcasts() {
		pl.Kind = PodcastsPlaylist
	} else if ipl.GetPurchasedMusic() {
		pl.Kind = PurchasedMusicPlaylist
	} else if ipl.GetAudiobooks() {
		pl.Kind = AudiobooksPlaylist
	} else if ipl.DistinguishedKind != nil {
		switch *ipl.DistinguishedKind {
		case 2:
			pl.Kind = MoviesPlaylist
		case 3:
			pl.Kind = TVShowsPlaylist
		case 4:
			pl.Kind = MusicPlaylist
		case 5:
			pl.Kind = AudiobooksPlaylist
		case 10:
			pl.Kind = PodcastsPlaylist
		case 19:
			pl.Kind = PurchasedPlaylist
		case 65:
			pl.Kind = DownloadedMusicPlaylist
		case 66:
			pl.Kind = DownloadedMoviesPlaylist
		case 67:
			pl.Kind = DownloadedTVShowsPlaylist
		default:
			pl.Kind = PlaylistKind(1000 + *ipl.DistinguishedKind)
		}
	} else if ipl.GetFolder() {
		pl.Kind = FolderPlaylist
	} else if ipl.GeniusTrackID != nil {
		pl.Kind = GeniusPlaylist
	} else if ipl.IsSmart() {
		pl.Kind = SmartPlaylist
	} else {
		pl.Kind = StandardPlaylist
	}
	pl.Validate()
	return pl
}

func (p *Playlist) Validate() error {
	return nil
}

