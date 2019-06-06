package itunes

import (
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
		Album:                m.Album,
		AlbumArtist:          m.AlbumArtist,
		AlbumRating:          fromInt32(m.AlbumRating),
		AlbumRatingComputed:  m.AlbumRatingComputed,
		Artist:               m.Artist,
		ArtworkCount:         fromInt32(m.ArtworkCount),
		BPM:                  fromInt32(m.Bpm),
		BitRate:              fromInt32(m.BitRate),
		Clean:                m.Clean,
		Comments:             m.Comments,
		Compilation:          m.Compilation,
		Composer:             m.Composer,
		ContentRating:        m.ContentRating,
		Date:                 fromTime(m.Date),
		DateAdded:            fromTime(m.DateAdded),
		DateModified:         fromTime(m.DateModified),
		Disabled:             m.Disabled,
		DiscCount:            fromInt32(m.DiscCount),
		DiscNumber:           fromInt32(m.DiscNumber),
		Episode:              m.Episode,
		EpisodeOrder:         fromInt32(m.EpisodeOrder),
		Explicit:             m.Explicit,
		FileFolderCount:      fromInt32(m.FileFolderCount),
		FileType:             fromInt32(m.FileType),
		Genre:                m.Genre,
		Grouping:             m.Grouping,
		HasVideo:             m.HasVideo,
		Kind:                 m.Kind,
		LibraryFolderCount:   fromInt32(m.LibraryFolderCount),
		Location:             m.Location,
		Master:               m.Master,
		Movie:                m.Movie,
		MusicVideo:           m.MusicVideo,
		Name:                 m.Name,
		PartOfGaplessAlbum:   m.PartOfGaplessAlbum,
		PersistentID:         PersistentID(m.GetPersistentId()),
		PlayCount:            fromInt32(m.PlayCount),
		PlayDate:             fromInt32(m.PlayDate),
		PlayDateUTC:          fromTime(m.PlayDateUtc),
		Podcast:              m.Podcast,
		Protected:            m.Protected,
		Purchased:            m.Purchased,
		PurchaseDate:         fromTime(m.PurchaseDate),
		Rating:               fromInt32(m.Rating),
		RatingComputed:       m.RatingComputed,
		ReleaseDate:          fromTime(m.ReleaseDate),
		SampleRate:           fromInt32(m.SampleRate),
		Season:               fromInt32(m.Season),
		Series:               m.Series,
		Size:                 fromInt32(m.Size),
		SkipCount:            fromInt32(m.SkipCount),
		SkipDate:             fromTime(m.SkipDate),
		SortAlbum:            m.SortAlbum,
		SortAlbumArtist:      m.SortAlbumArtist,
		SortArtist:           m.SortArtist,
		SortComposer:         m.SortComposer,
		SortName:             m.SortName,
		SortSeries:           m.SortSeries,
		StopTime:             fromInt32(m.StopTime),
		TVShow:               m.TvShow,
		TotalTime:            fromInt32(m.TotalTime),
		TrackCount:           fromInt32(m.TrackCount),
		TrackID:              fromInt32(m.TrackId),
		TrackNumber:          fromInt32(m.TrackNumber),
		TrackType:            m.TrackType,
		Unplayed:             m.Unplayed,
		VolumeAdjustment:     fromInt32(m.VolumeAdjustment),
		Work:                 m.Work,
		Year:                 fromInt32(m.Year),
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
		Master:               m.Master,
		PlaylistID:           fromInt32(m.PlaylistId),
		PlaylistPersistentID: PersistentID(m.GetPersistentId()),
		AllItems:             m.AllItems,
		Visible:              m.Visible,
		Name:                 m.Name,
		DistinguishedKind:    fromInt32(m.DistinguishedKind),
		Music:                m.Music,
		SmartInfo:            m.SmartInfo,
		SmartCriteria:        m.SmartCriteria,
		Movies:               m.Movies,
		TVShows:              m.TvShows,
		Podcasts:             m.Podcasts,
		Audiobooks:           m.Audiobooks,
		PurchasedMusic:       m.PurchasedMusic,
		Folder:               m.Folder,
	}
	if m.ParentPersistentId != nil {
		pid := PersistentID(*m.ParentPersistentId)
		pl.ParentPersistentID = &pid
	}
	if m.GeniusTrackId != nil {
		pid := PersistentID(*m.GeniusTrackId)
		pl.GeniusTrackID = &pid
	}
	pl.Children = make([]*Playlist, len(m.Children))
	for i, c := range m.Children {
		pl.Children[i] = FromProtoPlaylist(c)
	}
	pl.TrackIDs = make([]PersistentID, len(m.Items))
	for i, pid := range m.Items {
		pl.TrackIDs[i] = PersistentID(pid)
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
	lib.Tracks = map[PersistentID]*Track{}
	for _, tr := range m.Tracks {
		lib.Tracks[PersistentID(tr.GetPersistentId())] = FromProtoTrack(tr)
	}
	lib.Playlists = map[PersistentID]*Playlist{}
	for _, pl := range m.Playlists {
		lib.Playlists[PersistentID(pl.GetPersistentId())] = FromProtoPlaylist(pl)
	}
	for _, pl := range lib.Playlists {
		pl.MakeSmart()
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
