package itunes

import (
	"sort"

	"github.com/golang/protobuf/proto"
	"itunespb"
)

func fromInt32(v *int32) *int {
	if v == nil {
		return nil
	}
	i := int(*v)
	return &i
}

func fromTime(v *itunespb.Time) *Time {
	if v == nil {
		return nil
	}
	if v.Ms == nil {
		return nil
	}
	t := &Time{}
	t.SetEpochMS(*v.Ms)
	return t
}

func (tr *Track) LoadProto(m *itunespb.Track) {
	*tr = Track{
		Album:                m.GetAlbum(),
		AlbumArtist:          m.GetAlbumArtist(),
		AlbumRating:          uint8(m.GetAlbumRating()),
		//AlbumRatingComputed:  m.GetAlbumRatingComputed(),
		Artist:               m.GetArtist(),
		//ArtworkCount:         int(m.GetArtworkCount()),
		//BPM:                  int(m.GetBpm()),
		//BitRate:              int(m.GetBitRate()),
		//Clean:                m.GetClean(),
		Comments:             m.GetComments(),
		Compilation:          m.GetCompilation(),
		Composer:             m.GetComposer(),
		//ContentRating:        m.GetContentRating(),
		//Date:                 fromTime(m.Date),
		DateAdded:            fromTime(m.DateAdded),
		DateModified:         fromTime(m.DateModified),
		//Disabled:             m.GetDisabled(),
		DiscCount:            uint8(m.GetDiscCount()),
		DiscNumber:           uint8(m.GetDiscNumber()),
		//Episode:              m.GetEpisode(),
		//EpisodeOrder:         int(m.GetEpisodeOrder()),
		//Explicit:             m.GetExplicit(),
		//FileFolderCount:      int(m.GetFileFolderCount()),
		//FileType:             int(m.GetFileType()),
		Genre:                m.GetGenre(),
		Grouping:             m.GetGrouping(),
		//HasVideo:             m.GetHasVideo(),
		Kind:                 m.GetKind(),
		//LibraryFolderCount:   int(m.GetLibraryFolderCount()),
		Location:             m.GetLocation(),
		//Master:               m.GetMaster(),
		//Movie:                m.GetMovie(),
		//MusicVideo:           m.GetMusicVideo(),
		Name:                 m.GetName(),
		PartOfGaplessAlbum:   m.GetPartOfGaplessAlbum(),
		PersistentID:         PersistentID(m.GetPersistentId()),
		PlayCount:            uint(m.GetPlayCount()),
		//PlayDate:             int(m.GetPlayDate()),
		PlayDateUTC:          fromTime(m.PlayDateUtc),
		//Podcast:              m.GetPodcast(),
		//Protected:            m.GetProtected(),
		Purchased:            m.GetPurchased(),
		PurchaseDate:         fromTime(m.PurchaseDate),
		Rating:               uint8(m.GetRating()),
		//RatingComputed:       m.GetRatingComputed(),
		ReleaseDate:          fromTime(m.ReleaseDate),
		//SampleRate:           int(m.GetSampleRate()),
		//Season:               int(m.GetSeason()),
		//Series:               m.GetSeries(),
		Size:                 uint(m.GetSize()),
		SkipCount:            uint(m.GetSkipCount()),
		SkipDate:             fromTime(m.SkipDate),
		SortAlbum:            m.GetSortAlbum(),
		SortAlbumArtist:      m.GetSortAlbumArtist(),
		SortArtist:           m.GetSortArtist(),
		SortComposer:         m.GetSortComposer(),
		SortName:             m.GetSortName(),
		//SortSeries:           m.GetSortSeries(),
		//StopTime:             int(m.GetStopTime()),
		//TVShow:               m.GetTvShow(),
		TotalTime:            uint(m.GetTotalTime()),
		TrackCount:           uint8(m.GetTrackCount()),
		//TrackID:              int(m.GetTrackId()),
		TrackNumber:          uint8(m.GetTrackNumber()),
		//TrackType:            m.GetTrackType(),
		Unplayed:             m.GetUnplayed(),
		VolumeAdjustment:     uint8(m.GetVolumeAdjustment()),
		Work:                 m.GetWork(),
		//Year:                 int(m.GetYear()),
	}
}

func FromProtoTrack(m *itunespb.Track) *Track {
	tr := &Track{}
	tr.LoadProto(m)
	return tr
}

func (tr *Track) Deserialize(data []byte) error {
	m := &itunespb.Track{}
	err := proto.Unmarshal(data, m)
	if err != nil {
		return err
	}
	tr.LoadProto(m)
	return nil
}

func DeserializeTrack(data []byte) (*Track, error) {
	tr := &Track{}
	err := tr.Deserialize(data)
	if err != nil {
		return nil, err
	}
	return tr, nil
}

func (pl *Playlist) LoadProto(m *itunespb.Playlist) {
	*pl = Playlist{
		//Master:               m.Master,
		//PlaylistID:           fromInt32(m.PlaylistId),
		PlaylistPersistentID: PersistentID(m.GetPersistentId()),
		//AllItems:             m.AllItems,
		//Visible:              m.Visible,
		Name:                 m.GetName(),
		//DistinguishedKind:    fromInt32(m.DistinguishedKind),
		//Music:                m.Music,
		//SmartInfo:            m.SmartInfo,
		//SmartCriteria:        m.SmartCriteria,
		//Movies:               m.Movies,
		//TVShows:              m.TvShows,
		//Podcasts:             m.Podcasts,
		//Audiobooks:           m.Audiobooks,
		//PurchasedMusic:       m.PurchasedMusic,
		Folder:               m.GetFolder(),
	}
	if m.ParentPersistentId != nil {
		pid := PersistentID(*m.ParentPersistentId)
		pl.ParentPersistentID = &pid
	}
	if m.GeniusTrackId != nil {
		pid := PersistentID(*m.GeniusTrackId)
		pl.GeniusTrackID = &pid
	}
	if pl.Folder {
		pl.Children = make([]*Playlist, len(m.Children))
		for i, c := range m.Children {
			pl.Children[i] = FromProtoPlaylist(c)
		}
	} else if m.SmartInfo != nil && len(m.SmartInfo) > 0 && m.SmartCriteria != nil && len(m.SmartCriteria) > 0 {
		pl.Smart, _ = ParseSmartPlaylist(m.SmartInfo, m.SmartCriteria)
	} else {
		pl.TrackIDs = make([]PersistentID, len(m.Items))
		for i, pid := range m.Items {
			pl.TrackIDs[i] = PersistentID(pid)
		}
	}
}

func FromProtoPlaylist(m *itunespb.Playlist) *Playlist {
	pl := &Playlist{}
	pl.LoadProto(m)
	return pl
}

func (pl *Playlist) Deserialize(data []byte) error {
	m := &itunespb.Playlist{}
	err := proto.Unmarshal(data, m)
	if err != nil {
		return err
	}
	pl.LoadProto(m)
	return nil
}

func DeserializePlaylist(data []byte) (*Playlist, error) {
	pl := &Playlist{}
	err := pl.Deserialize(data)
	if err != nil {
		return nil, err
	}
	return pl, nil
}

func (lib *Library) LoadProto(m *itunespb.Library) {
	*lib = Library{
		FileName:             m.FileName,
		MajorVersion:         fromInt32(m.MajorVersion),
		MinorVersion:         fromInt32(m.MinorVersion),
		ApplicationVersion:   m.ApplicationVersion,
		Date:                 fromTime(m.Date),
		Features:             fromInt32(m.Features),
		ShowContentRatings:   m.ShowContentRatings,
		PersistentID:         PersistentID(m.GetPersistentId()),
		MusicFolder:          m.MusicFolder,
	}
	lib.Tracks = make([]*Track, len(m.Tracks))
	for i, tr := range m.Tracks {
		lib.Tracks[i] = FromProtoTrack(tr)
	}
	sort.Sort(sts(lib.Tracks))
	lib.Playlists = map[PersistentID]*Playlist{}
	for _, pl := range m.Playlists {
		lib.Playlists[PersistentID(pl.GetPersistentId())] = FromProtoPlaylist(pl)
	}
	for _, pl := range lib.Playlists {
		pl.Nest(lib)
	}
}

func FromProtoLibrary(m *itunespb.Library) *Library {
	lib := &Library{}
	lib.LoadProto(m)
	return lib
}

func (lib *Library) Deserialize(data []byte) error {
	m := &itunespb.Library{}
	err := proto.Unmarshal(data, m)
	if err != nil {
		return err
	}
	lib.LoadProto(m)
	return nil
}

func DeserializeLibrary(data []byte) (*Library, error) {
	lib := &Library{}
	err := lib.Deserialize(data)
	if err != nil {
		return nil, err
	}
	return lib, nil
}
