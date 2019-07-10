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

func toInt32p(v *int) *int32 {
	if v == nil {
		return nil
	}
	i := int32(*v)
	return &i
}

func toInt64(v uint64) *int64 {
	if v == 0 {
		return nil
	}
	i := int64(v)
	return &i
}

func toInt32(v int) *int32 {
	if v == 0 {
		return nil
	}
	i := int32(v)
	return &i
}

func toBool(v bool) *bool {
	if !v {
		return nil
	}
	return &v
}

func toTime(v *Time) *itunespb.Time {
	if v == nil {
		return nil
	}
	ms := v.EpochMS()
	return &itunespb.Time{Ms: &ms}
}

func toString(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}

func (tr *Track) ProtoPrepare(depth int) *itunespb.Track {
	if depth == 0 {
		return &itunespb.Track{PersistentId: proto.Uint64(uint64(tr.PersistentID))}
	}
	return &itunespb.Track{
		Album:                toString(tr.Album),
		AlbumArtist:          toString(tr.AlbumArtist),
		AlbumRating:          toInt32(int(tr.AlbumRating)),
		//AlbumRatingComputed:  toBool(tr.AlbumRatingComputed),
		Artist:               toString(tr.Artist),
		//ArtworkCount:         toInt32(tr.ArtworkCount),
		//Bpm:                  toInt32(tr.BPM),
		//BitRate:              toInt32(tr.BitRate),
		//Clean:                toBool(tr.Clean),
		Comments:             toString(tr.Comments),
		Compilation:          toBool(tr.Compilation),
		Composer:             toString(tr.Composer),
		//ContentRating:        toString(tr.ContentRating),
		//Date:                 toTime(tr.Date),
		DateAdded:            toTime(tr.DateAdded),
		DateModified:         toTime(tr.DateModified),
		//Disabled:             toBool(tr.Disabled),
		DiscCount:            toInt32(int(tr.DiscCount)),
		DiscNumber:           toInt32(int(tr.DiscNumber)),
		//Episode:              toString(tr.Episode),
		//EpisodeOrder:         toInt32(tr.EpisodeOrder),
		//Explicit:             toBool(tr.Explicit),
		//FileFolderCount:      toInt32(tr.FileFolderCount),
		//FileType:             toInt32(tr.FileType),
		Genre:                toString(tr.Genre),
		Grouping:             toString(tr.Grouping),
		//HasVideo:             toBool(tr.HasVideo),
		Kind:                 toString(tr.Kind),
		//LibraryFolderCount:   toInt32(tr.LibraryFolderCount),
		Location:             toString(tr.Location),
		//Master:               toBool(tr.Master),
		//Movie:                toBool(tr.Movie),
		//MusicVideo:           toBool(tr.MusicVideo),
		Name:                 toString(tr.Name),
		PartOfGaplessAlbum:   toBool(tr.PartOfGaplessAlbum),
		PersistentId:         proto.Uint64(uint64(tr.PersistentID)),
		PlayCount:            toInt32(int(tr.PlayCount)),
		//PlayDate:             toInt32(tr.PlayDate),
		PlayDate:             toTime(tr.PlayDate),
		//Podcast:              toBool(tr.Podcast),
		//Protected:            toBool(tr.Protected),
		Purchased:            toBool(tr.Purchased),
		PurchaseDate:         toTime(tr.PurchaseDate),
		Rating:               toInt32(int(tr.Rating)),
		//RatingComputed:       toBool(tr.RatingComputed),
		ReleaseDate:          toTime(tr.ReleaseDate),
		//SampleRate:           toInt32(tr.SampleRate),
		//Season:               toInt32(tr.Season),
		//Series:               toString(tr.Series),
		Size:                 toInt64(tr.Size),
		SkipCount:            toInt32(int(tr.SkipCount)),
		SkipDate:             toTime(tr.SkipDate),
		SortAlbum:            toString(tr.SortAlbum),
		SortAlbumArtist:      toString(tr.SortAlbumArtist),
		SortArtist:           toString(tr.SortArtist),
		SortComposer:         toString(tr.SortComposer),
		SortName:             toString(tr.SortName),
		//SortSeries:           toString(tr.SortSeries),
		//StopTime:             toInt32(tr.StopTime),
		//TvShow:               toBool(tr.TVShow),
		TotalTime:            toInt32(int(tr.TotalTime)),
		TrackCount:           toInt32(int(tr.TrackCount)),
		//TrackId:              toInt32(tr.TrackID),
		TrackNumber:          toInt32(int(tr.TrackNumber)),
		//TrackType:            toString(tr.TrackType),
		Unplayed:             toBool(tr.Unplayed),
		VolumeAdjustment:     toInt32(int(tr.VolumeAdjustment)),
		Work:                 toString(tr.Work),
		//Year:                 toInt32(int(tr.Year)),
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
			PersistentId: proto.Uint64(uint64(pl.PersistentID)),
		}
		if pl.ParentPersistentID != nil {
			m.ParentPersistentId = proto.Uint64(uint64(*pl.ParentPersistentID))
		}
		return m
	}
	var info, criteria []byte
	if pl.Smart != nil {
		info, criteria, _ = pl.Smart.Encode()
	}
	m := &itunespb.Playlist{
		//Master:               pl.Master,
		//PlaylistId:           toInt32p(pl.PlaylistID),
		PersistentId:         proto.Uint64(uint64(pl.PersistentID)),
		//AllItems:             pl.AllItems,
		//Visible:              pl.Visible,
		Name:                 proto.String(pl.Name),
		//DistinguishedKind:    toInt32p(pl.DistinguishedKind),
		//Music:                pl.Music,
		SmartInfo:            info,
		SmartCriteria:        criteria,
		//Movies:               pl.Movies,
		//TvShows:              pl.TVShows,
		//Podcasts:             pl.Podcasts,
		//Audiobooks:           pl.Audiobooks,
		//PurchasedMusic:       pl.PurchasedMusic,
		Folder:               toBool(pl.Folder),
	}
	if pl.ParentPersistentID != nil {
		m.ParentPersistentId = proto.Uint64(uint64(*pl.ParentPersistentID))
	}
	if pl.GeniusTrackID != nil {
		m.GeniusTrackId = proto.Uint64(uint64(*pl.GeniusTrackID))
	}
	if depth > 1 {
		m.Items = make([]uint64, len(pl.TrackIDs))
		for i, pid := range pl.TrackIDs {
			m.Items[i] = uint64(pid)
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
	fn := filepath.Join(dn, "playlists", pl.PersistentID.EncodeToString() + ".pb")
	return pl.SerializeToFile(fn)
}

func (lib *Library) ProtoPrepare(depth int) *itunespb.Library {
	m := &itunespb.Library{
		FileName:             proto.String(lib.FileName),
		MajorVersion:         toInt32(lib.MajorVersion),
		MinorVersion:         toInt32(lib.MinorVersion),
		ApplicationVersion:   proto.String(lib.ApplicationVersion),
		Date:                 toTime(&lib.Date),
		Features:             toInt32(lib.Features),
		ShowContentRatings:   proto.Bool(lib.ShowContentRatings),
		PersistentId:         proto.Uint64(uint64(lib.PersistentID)),
		MusicFolder:          proto.String(lib.MusicFolder),
	}
	if depth == 0 {
		return m
	}
	m.Tracks = make([]*itunespb.Track, len(lib.Tracks))
	for i, tr := range lib.Tracks {
		m.Tracks[i] = tr.ProtoPrepare(depth - 1)
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
