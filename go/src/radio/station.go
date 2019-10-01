package radio

import (
	"fmt"
	"math/rand"

	"musicdb"
)

type Station interface{
	Next() string
	Name() string
	Description() string
}

type PlaylistStation struct {
	db *musicdb.DB
	playlistId musicdb.PersistentID
	tracks []*musicdb.Track
	index int
	shuffle bool
}

func NewPlaylistStation(db *musicdb.DB, playlistId musicdb.PersistentID, shuffle bool) (*PlaylistStation, error) {
	return &PlaylistStation{
		db: db,
		playlistId: playlistId,
		shuffle: shuffle,
		index: 0,
	}, nil
}

func (s *PlaylistStation) Name() string {
	pl, err := s.db.GetPlaylist(s.playlistId)
	if err != nil {
		return s.playlistId.String()
	}
	return pl.Name
}

func (s *PlaylistStation) Description() string {
	if s.shuffle {
		return fmt.Sprintf(`Playlist "%s" station, shuffled`, s.Name())
	}
	return fmt.Sprintf(`Playlist "%s" station`, s.Name())
}

func (s *PlaylistStation) loadTracks(pl *musicdb.Playlist) []*musicdb.Track {
	var err error
	if pl == nil {
		pl, err = s.db.GetPlaylist(s.playlistId)
		if err != nil {
			return []*musicdb.Track{}
		}
	}
	var trs []*musicdb.Track
	if pl.Folder {
		seen := map[musicdb.PersistentID]bool{}
		if pl.Children == nil || len(pl.Children) == 0 {
			root := pl.PersistentID
			pl.Children, err = s.db.GetPlaylistTree(&root)
		}
		for _, cpl := range pl.Children {
			for _, tr := range s.loadTracks(cpl) {
				if _, ok := seen[tr.PersistentID]; !ok {
					trs = append(trs, tr)
					seen[tr.PersistentID] = true
				}
			}
		}
	} else if pl.Smart != nil {
		trs, _ = s.db.SmartTracks(pl.Smart)
	} else {
		trs, _ = s.db.PlaylistTracks(pl)
	}
	return trs
}

func (s *PlaylistStation) Next() string {
	if s.index >= len(s.tracks) {
		s.index = 0
		s.tracks = s.loadTracks(nil)
		if s.shuffle {
			rand.Shuffle(len(s.tracks), func(i, j int) { s.tracks[i], s.tracks[j] = s.tracks[j], s.tracks[i] })
		}
	}
	fn := s.tracks[s.index].Path()
	s.index++
	return fn
}

