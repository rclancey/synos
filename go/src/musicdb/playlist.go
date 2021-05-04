package musicdb

import (
	"bytes"
	"encoding/gob"
	"io"
	"log"
	"sort"
	//"strings"
	//"time"

	"github.com/pkg/errors"

	"itunes"
	"itunes/loader"
)

type Playlist struct {
	PersistentID         PersistentID   `json:"persistent_id,omitempty" db:"id"`
	JookiID              *string        `json:"jooki_id" db:"jooki_id"`
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
	return errors.Wrap(enc.Encode(&xp), "can't serialize playlist")
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
	return errors.Wrap(dec.Decode(p), "can't deserialize playlist")
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

type SortablePlaylistList []*Playlist
func (spl SortablePlaylistList) Len() int { return len(spl) }
func (spl SortablePlaylistList) Swap(i, j int) {
	spl[i], spl[j] = spl[j], spl[i]
}
func (spl SortablePlaylistList) Less(i, j int) bool {
	ap := int(spl[i].Kind)
	bp := int(spl[j].Kind)
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
			if err == nil && len(ispl.Criteria.Rules) > 0 {
				pl.Smart = SmartPlaylistFromITunes(ispl)
			}
		}
		if pl.Smart == nil {
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

