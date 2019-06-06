package itunes

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/golang/protobuf/proto"
	"itunespb"
)

func ensureDir(fn string) error {
	dn := filepath.Dir(fn)
	st, err := os.Stat(dn)
	if err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		err = os.MkdirAll(dn, os.FileMode(0755))
		if err != nil {
			return err
		}
		return nil
	}
	if !st.IsDir() {
		return fmt.Errorf("%s exists and is not a directory", dn)
	}
	return nil
}

func toInt32(v *int) *int32 {
	if v == nil {
		return nil
	}
	i := int32(*v)
	return &i
}

func toTime(v *Time) *itunespb.Time {
	if v == nil {
		return nil
	}
	ms := v.EpochMS()
	return &itunespb.Time{Ms: &ms}
}

func (tr *Track) ProtoPrepare(depth int) *itunespb.Track {
	if depth == 0 {
		return &itunespb.Track{PersistentId: proto.Uint64(uint64(tr.PersistentID))}
	}
	return &itunespb.Track{
		Album:                tr.Album,
		AlbumArtist:          tr.AlbumArtist,
		AlbumRating:          toInt32(tr.AlbumRating),
		AlbumRatingComputed:  tr.AlbumRatingComputed,
		Artist:               tr.Artist,
		ArtworkCount:         toInt32(tr.ArtworkCount),
		Bpm:                  toInt32(tr.BPM),
		BitRate:              toInt32(tr.BitRate),
		Clean:                tr.Clean,
		Comments:             tr.Comments,
		Compilation:          tr.Compilation,
		Composer:             tr.Composer,
		ContentRating:        tr.ContentRating,
		Date:                 toTime(tr.Date),
		DateAdded:            toTime(tr.DateAdded),
		DateModified:         toTime(tr.DateModified),
		Disabled:             tr.Disabled,
		DiscCount:            toInt32(tr.DiscCount),
		DiscNumber:           toInt32(tr.DiscNumber),
		Episode:              tr.Episode,
		EpisodeOrder:         toInt32(tr.EpisodeOrder),
		Explicit:             tr.Explicit,
		FileFolderCount:      toInt32(tr.FileFolderCount),
		FileType:             toInt32(tr.FileType),
		Genre:                tr.Genre,
		Grouping:             tr.Grouping,
		HasVideo:             tr.HasVideo,
		Kind:                 tr.Kind,
		LibraryFolderCount:   toInt32(tr.LibraryFolderCount),
		Location:             tr.Location,
		Master:               tr.Master,
		Movie:                tr.Movie,
		MusicVideo:           tr.MusicVideo,
		Name:                 tr.Name,
		PartOfGaplessAlbum:   tr.PartOfGaplessAlbum,
		PersistentId:         proto.Uint64(uint64(tr.PersistentID)),
		PlayCount:            toInt32(tr.PlayCount),
		PlayDate:             toInt32(tr.PlayDate),
		PlayDateUtc:          toTime(tr.PlayDateUTC),
		Podcast:              tr.Podcast,
		Protected:            tr.Protected,
		Purchased:            tr.Purchased,
		PurchaseDate:         toTime(tr.PurchaseDate),
		Rating:               toInt32(tr.Rating),
		RatingComputed:       tr.RatingComputed,
		ReleaseDate:          toTime(tr.ReleaseDate),
		SampleRate:           toInt32(tr.SampleRate),
		Season:               toInt32(tr.Season),
		Series:               tr.Series,
		Size:                 toInt32(tr.Size),
		SkipCount:            toInt32(tr.SkipCount),
		SkipDate:             toTime(tr.SkipDate),
		SortAlbum:            tr.SortAlbum,
		SortAlbumArtist:      tr.SortAlbumArtist,
		SortArtist:           tr.SortArtist,
		SortComposer:         tr.SortComposer,
		SortName:             tr.SortName,
		SortSeries:           tr.SortSeries,
		StopTime:             toInt32(tr.StopTime),
		TvShow:               tr.TVShow,
		TotalTime:            toInt32(tr.TotalTime),
		TrackCount:           toInt32(tr.TrackCount),
		TrackId:              toInt32(tr.TrackID),
		TrackNumber:          toInt32(tr.TrackNumber),
		TrackType:            tr.TrackType,
		Unplayed:             tr.Unplayed,
		VolumeAdjustment:     toInt32(tr.VolumeAdjustment),
		Work:                 tr.Work,
		Year:                 toInt32(tr.Year),
	}
}

func (tr *Track) Serialize(depth int) ([]byte, error) {
	return proto.Marshal(tr.ProtoPrepare(depth))
}

func (tr *Track) SerializeToFile(fn string) error {
	data, err := tr.Serialize(1)
	if err != nil {
		return err
	}
	f, err := os.Create(fn)
	if err != nil {
		return err
	}
	_, err = f.Write(data)
	return err
}

func (pl *Playlist) ProtoPrepare(depth int) *itunespb.Playlist {
	if depth == 0 {
		m := &itunespb.Playlist{
			PersistentId: proto.Uint64(uint64(pl.PlaylistPersistentID)),
		}
		if pl.ParentPersistentID != nil {
			m.ParentPersistentId = proto.Uint64(uint64(*pl.ParentPersistentID))
		}
		return m
	}
	m := &itunespb.Playlist{
		Master:               pl.Master,
		PlaylistId:           toInt32(pl.PlaylistID),
		PersistentId:         proto.Uint64(uint64(pl.PlaylistPersistentID)),
		AllItems:             pl.AllItems,
		Visible:              pl.Visible,
		Name:                 pl.Name,
		DistinguishedKind:    toInt32(pl.DistinguishedKind),
		Music:                pl.Music,
		SmartInfo:            pl.SmartInfo,
		SmartCriteria:        pl.SmartCriteria,
		Movies:               pl.Movies,
		TvShows:              pl.TVShows,
		Podcasts:             pl.Podcasts,
		Audiobooks:           pl.Audiobooks,
		PurchasedMusic:       pl.PurchasedMusic,
		Folder:               pl.Folder,
	}
	if pl.ParentPersistentID != nil {
		m.ParentPersistentId = proto.Uint64(uint64(*pl.ParentPersistentID))
	}
	if pl.GeniusTrackID != nil {
		m.GeniusTrackId = proto.Uint64(uint64(*pl.GeniusTrackID))
	}
	if depth > 1 {
		m.Children = make([]*itunespb.Playlist, len(pl.Children))
		for i, c := range pl.Children {
			m.Children[i] = c.ProtoPrepare(depth)
		}
		if depth > 2 {
			m.Items = make([]uint64, len(pl.TrackIDs))
			for i, pid := range pl.TrackIDs {
				m.Items[i] = uint64(pid)
			}
		}
	}
	return m
}

func (pl *Playlist) Serialize(depth int) ([]byte, error) {
	return proto.Marshal(pl.ProtoPrepare(depth))
}

func (pl *Playlist) SerializeToFile(fn string) error {
	data, err := pl.Serialize(1)
	if err != nil {
		return err
	}
	f, err := os.Create(fn)
	if err != nil {
		return err
	}
	_, err = f.Write(data)
	return err
}

func (pl *Playlist) SerializeToDirectory(dn string) error {
	xdn := filepath.Join(dn, "playlists")
	if _, err := os.Stat(xdn); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		err = os.MkdirAll(xdn, os.FileMode(0755))
		if err != nil {
			return err
		}
	}
	fn := filepath.Join(dn, "playlists", pl.PlaylistPersistentID.EncodeToString() + ".pb")
	return pl.SerializeToFile(fn)
}

func (lib *Library) ProtoPrepare(depth int) *itunespb.Library {
	m := &itunespb.Library{
		FileName:             lib.FileName,
		MajorVersion:         toInt32(lib.MajorVersion),
		MinorVersion:         toInt32(lib.MinorVersion),
		ApplicationVersion:   lib.ApplicationVersion,
		Date:                 toTime(lib.Date),
		Features:             toInt32(lib.Features),
		ShowContentRatings:   lib.ShowContentRatings,
		PersistentId:         proto.Uint64(uint64(lib.PersistentID)),
		MusicFolder:          lib.MusicFolder,
	}
	if depth == 0 {
		return m
	}
	m.Tracks = make([]*itunespb.Track, len(lib.Tracks))
	i := 0
	for _, tr := range lib.Tracks {
		m.Tracks[i] = tr.ProtoPrepare(depth - 1)
		i++
	}
	m.Playlists = make([]*itunespb.Playlist, len(lib.Playlists))
	for i, pl := range lib.Playlists {
		m.Playlists[i] = pl.ProtoPrepare(depth - 1)
	}
	return m
}

func (lib *Library) Serialize(depth int) ([]byte, error) {
	return proto.Marshal(lib.ProtoPrepare(depth))
}

func (lib *Library) SerializeToFile(fn string) error {
	data, err := lib.Serialize(1)
	if err != nil {
		return err
	}
	f, err := os.Create(fn)
	if err != nil {
		return err
	}
	_, err = f.Write(data)
	return err
}

func (lib *Library) SerializeToDirectory(dn string) error {
	fn := filepath.Join(dn, "library.pb")
	return lib.SerializeToFile(fn)
}
