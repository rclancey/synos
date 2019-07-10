package itunes

import (
	"math/rand"
	"path"
	"sort"
	"strings"

	"itunes/loader"
)

type Library struct {
	FileName string
	MajorVersion int
	MinorVersion int
	ApplicationVersion string
	Date Time
	Features int
	ShowContentRatings bool
	PersistentID PersistentID
	MusicFolder string
	Tracks []*Track
	Playlists map[PersistentID]*Playlist
	PlaylistTree []*Playlist
}

func NewLibrary() *Library {
	lib := &Library{}
	lib.Tracks = make([]*Track, 0)
	lib.Playlists = map[PersistentID]*Playlist{}
	lib.PlaylistTree = []*Playlist{}
	return lib
}

func (lib *Library) Load(fn string) error {
	l := loader.NewLoader()
	go l.Load(fn)
	for {
		select {
		case update := <-l.LibraryCh:
			lib.FileName = update.GetFileName()
			lib.MajorVersion = update.GetMajorVersion()
			lib.MinorVersion = update.GetMinorVersion()
			lib.ApplicationVersion = update.GetApplicationVersion()
			lib.Date = Time{update.GetDate()}
			lib.Features = update.GetFeatures()
			lib.ShowContentRatings = update.GetShowContentRatings()
			lib.PersistentID = PersistentID(update.GetPersistentID())
			lib.MusicFolder = update.GetMusicFolder()
		case track := <-l.TrackCh:
			if track.GetMusicVideo() {
				continue
			}
			if track.GetPodcast() {
				continue
			}
			if track.GetMovie() {
				continue
			}
			if track.GetTVShow() {
				continue
			}
			if track.GetHasVideo() {
				continue
			}
			if path.Ext(track.GetLocation()) == ".m4b" {
				// audiobook
				continue
			}
			tr := &Track{
				PersistentID:       PersistentID(track.GetPersistentID()),
				Album:              track.GetAlbum(),
				AlbumArtist:        track.GetAlbumArtist(),
				AlbumRating:        track.GetAlbumRating(),
				Artist:             track.GetArtist(),
				Comments:           track.GetComments(),
				Compilation:        track.GetCompilation(),
				Composer:           track.GetComposer(),
				DateAdded:          &Time{track.GetDateAdded()},
				DateModified:       &Time{track.GetDateModified()},
				DiscCount:          track.GetDiscCount(),
				DiscNumber:         track.GetDiscNumber(),
				Genre:              track.GetGenre(),
				Grouping:           track.GetGrouping(),
				Kind:               track.GetKind(),
				Location:           track.GetLocation(),
				Loved:              track.Loved,
				Name:               track.GetName(),
				PartOfGaplessAlbum: track.GetPartOfGaplessAlbum(),
				PlayCount:          track.GetPlayCount(),
				Purchased:          track.GetPurchased(),
				Rating:             track.GetRating(),
				Size:               track.GetSize(),
				SkipCount:          track.GetSkipCount(),
				SortAlbum:          track.GetSortAlbum(),
				SortAlbumArtist:    track.GetSortAlbumArtist(),
				SortArtist:         track.GetSortArtist(),
				SortComposer:       track.GetSortComposer(),
				SortName:           track.GetSortName(),
				TotalTime:          track.GetTotalTime(),
				TrackCount:         track.GetTrackCount(),
				TrackNumber:        track.GetTrackNumber(),
				Unplayed:           track.GetUnplayed(),
				VolumeAdjustment:   track.GetVolumeAdjustment(),
				Work:               track.GetWork(),
			}
			if track.PlayDate != nil {
				tr.PlayDate = &Time{*track.PlayDate}
			}
			if track.PurchaseDate != nil {
				tr.PurchaseDate = &Time{*track.PurchaseDate}
			}
			if track.ReleaseDate != nil {
				tr.ReleaseDate = &Time{*track.ReleaseDate}
			}
			if track.SkipDate != nil {
				tr.SkipDate = &Time{*track.SkipDate}
			}
			lib.AddTrack(tr)
		case playlist := <-l.PlaylistCh:
			if playlist.GetMaster() {
				continue
			}
			if playlist.GetMusic() {
				continue
			}
			if playlist.GetMovies() {
				continue
			}
			if playlist.GetPodcasts() {
				continue
			}
			if playlist.GetPurchasedMusic() {
				continue
			}
			if playlist.GetAudiobooks() {
				continue
			}
			if !playlist.GetVisible() {
				continue
			}
			pl := &Playlist{
				PersistentID: PersistentID(playlist.GetPersistentID()),
				Folder: playlist.GetFolder(),
				Name: playlist.GetName(),
			}
			if playlist.ParentPersistentID != nil {
				pid := PersistentID(*playlist.ParentPersistentID)
				pl.ParentPersistentID = &pid
			}
			if playlist.GeniusTrackID != nil {
				pid := PersistentID(*playlist.GeniusTrackID)
				pl.GeniusTrackID = &pid
			}
			if playlist.IsSmart() {
				pl.Smart, _ = ParseSmartPlaylist(playlist.SmartInfo, playlist.SmartCriteria)
			}
			if !pl.Folder && pl.Smart == nil {
				pl.TrackIDs = make([]PersistentID, len(playlist.TrackIDs))
				for i, id := range playlist.TrackIDs {
					pl.TrackIDs[i] = PersistentID(id)
				}
			}
			if pl.Folder {
				pl.Children = []*Playlist{}
			}
			lib.Playlists[pl.PersistentID] = pl
		case err := <-l.ErrorCh:
			return err
		}
	}
	return nil
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
		PersistentID: PersistentID(rand.Uint64()),
		ParentPersistentID: parentId,
		Name: name,
		TrackIDs: []PersistentID{},
	}
	lib.Playlists[p.PersistentID] = p
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

func (lib *Library) RemoveTrack(id PersistentID) {
	f := func(i int) bool {
		return lib.Tracks[i].PersistentID >= id
	}
	idx := sort.Search(len(lib.Tracks), f)
	if idx < 0 || idx >= len(lib.Tracks) || lib.Tracks[idx].PersistentID != id {
		// track not in library, ignore
		return
	}
	tracks := append(lib.Tracks[:idx], lib.Tracks[idx+1:]...)
	lib.Tracks = tracks
	for _, pl := range lib.Playlists {
		if pl.Folder || pl.Smart != nil {
			continue
		}
		found := 0
		for _, tid := range pl.TrackIDs {
			if tid == id {
				found += 1
			}
		}
		if found > 0 {
			ids := make([]PersistentID, len(pl.TrackIDs) - found)
			i := 0
			for _, tid := range pl.TrackIDs {
				if tid != id {
					ids[i] = tid
					i += 1
				}
			}
			pl.TrackIDs = ids
		}
	}
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

type spls []*Playlist
func (s spls) Len() int { return len(s) }
func (s spls) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s spls) Less(i, j int) bool {
	ap := s[i].Priority()
	bp := s[j].Priority()
	if ap < bp {
		return true
	}
	if ap > bp {
		return false
	}
	return s[i].Name < s[j].Name
}

func (l *Library) RenestPlaylists() {
	l.PlaylistTree = []*Playlist{}
	for _, pl := range l.Playlists {
		if pl.Folder {
			pl.Children = []*Playlist{}
		} else {
			pl.Children = nil
		}
	}
	for _, pl := range l.Playlists {
		if pl.ParentPersistentID == nil {
			l.PlaylistTree = append(l.PlaylistTree, pl)
		} else {
			parent, ok := l.Playlists[*pl.ParentPersistentID]
			if !ok || !parent.Folder {
				l.PlaylistTree = append(l.PlaylistTree, pl)
			} else {
				parent.Children = append(parent.Children, pl)
			}
		}
	}
	for _, pl := range l.Playlists {
		if pl.Folder {
			sort.Sort(spls(pl.Children))
		}
	}
	sort.Sort(spls(l.PlaylistTree))
}

func (l *Library) MovePlaylist(p *Playlist, parentId *PersistentID) error {
	if p.ParentPersistentID == nil && parentId == nil {
		return nil
	}
	if p.ParentPersistentID != nil && parentId != nil && *p.ParentPersistentID == *parentId {
		return nil
	}
	p.Unnest(l)
	p.ParentPersistentID = parentId
	p.Nest(l)
	return nil
}
