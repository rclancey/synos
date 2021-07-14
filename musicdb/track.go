package musicdb

import (
	"fmt"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/dhowden/tag"
	"github.com/goulash/audio"
	"github.com/hajimehoshi/go-mp3"
	"github.com/pkg/errors"

	"github.com/rclancey/itunes/loader"
)

type Track struct {
	PersistentID     PersistentID `json:"persistent_id" db:"id"`
	OwnerID          PersistentID `json:"owner_id,omitempty" db:"owner_id"`
	JookiID          *string      `json:"jooki_id,omitempty" db:"jooki_id"`
	Album            *string      `json:"album,omitempty" db:"album"`
	AlbumArtist      *string      `json:"album_artist,omitempty" db:"album_artist"`
	AlbumRating      *uint8       `json:"album_rating,omitempty" db:"album_rating"`
	Artist           *string      `json:"artist,omitempty" db:"artist"`
	BitRate          *uint        `json:"bitrate,omitempty" db:"bitrate"`
	BPM              *uint16      `json:"bpm,omitempty" db:"bpm"`
	Comments         *string      `json:"comments,omitempty" db:"comments"`
	Compilation      bool         `json:"compilation,omitempty" db:"compilation"`
	Composer         *string      `json:"composer,omitempty" db:"composer"`
	DateAdded        *Time        `json:"date_added,omitempty" db:"date_added"`
	DateModified     *Time        `json:"date_modified,omitempty" db:"date_modified"`
	DiscCount        *uint8       `json:"disc_count,omitempty" db:"disc_count"`
	DiscNumber       *uint8       `json:"disc_number,omitempty" db:"disc_number"`
	FileType         FileType     `json:"file_type,omitempty" db:"file_type"`
	Gapless          bool         `json:"gapless,omitempty" db:"gapless"`
	Genre            *string      `json:"genre,omitempty" db:"genre"`
	Grouping         *string      `json:"grouping,omitempty" db:"grouping"`
	Kind             *string      `json:"kind,omitempty" db:"kind"`
	Location         *string      `json:"location" db:"location"`
	Loved            *bool        `json:"loved" db:"loved"`
	MovementCount    *uint8       `json:"movement_count,omitempty" db:"movement_count"`
	MovementName     *string      `json:"movement_name,omitempty" db:"movement_name"`
	MovementNumber   *uint8       `json:"movement_number,omitempty" db:"movement_number"`
	Name             *string      `json:"name,omitempty" db:"name"`
	PlayCount        uint         `json:"play_count,omitempty" db:"play_count"`
	PlayDate         *Time        `json:"play_date,omitempty" db:"play_date"`
	Purchased        bool         `json:"purchased,omitempty" db:"purchased"`
	PurchaseDate     *Time        `json:"purchase_date,omitempty" db:"purchase_date"`
	Rating           *uint8       `json:"rating,omitempty" db:"rating"`
	ReleaseDate      *Time        `json:"release_date,omitempty" db:"release_date"`
	SampleRate       *uint        `json:"sample_rate,omitempty" db:"sample_rate"`
	Size             *uint64      `json:"size,omitempty" db:"size"`
	SkipCount        uint         `json:"skip_count,omitempty" db:"skip_count"`
	SkipDate         *Time        `json:"skip_date,omitempty" db:"skip_date"`
	SortAlbum        *string      `json:"sort_album,omitempty" db:"sort_album"`
	SortAlbumArtist  *string      `json:"sort_album_artist,omitempty" db:"sort_album_artist"`
	SortArtist       *string      `json:"sort_artist,omitempty" db:"sort_artist"`
	SortComposer     *string      `json:"sort_composer,omitempty" db:"sort_composer"`
	SortGenre        *string      `json:"sort_genre,omitempty" db:"sort_genre"`
	SortName         *string      `json:"sort_name,omitempty" db:"sort_name"`
	TotalTime        *uint        `json:"total_time,omitempty" db:"total_time"`
	TrackCount       *uint8       `json:"track_count,omitempty" db:"track_count"`
	TrackNumber      *uint8       `json:"track_number,omitempty" db:"track_number"`
	VolumeAdjustment *uint8       `json:"volume_adjustment,omitempty" db:"volume_adjustment"`
	Work             *string      `json:"work,omitempty" db:"work"`
	MediaKind        MediaKind    `json:"media_kind,omitempty" db:"media_kind"`
	ArtworkURL       *string      `json:"artwork_url,omitempty" db:"-"`
	SpotifyAlbumArtistID *string      `json:"spotify_album_artist_id" db:"spotify_album_artist_id"`
	SpotifyAlbumID       *string      `json:"spotify_album_id" db:"spotify_album_id"`
	SpotifyArtistID      *string      `json:"spotify_artist_id" db:"spotify_artist_id"`
	SpotifyTrackID       *string      `json:"spotify_track_id" db:"spotify_track_id"`
	Homedir              *string      `json:"-" db:"homedir" dbignore:"insert update"`
	db *DB
}

func (t *Track) ID() PersistentID {
	return t.PersistentID
}

func (t *Track) SetID(pid PersistentID) {
	t.PersistentID = pid
}

func (t *Track) String() string {
	s := ""
	delim := ""
	if t.AlbumArtist != nil {
		s += delim + *t.AlbumArtist
		delim = " / "
	} else if t.Artist != nil {
		s += delim + *t.Artist
		delim = " / "
	}
	if t.Album != nil {
		s += delim + *t.Album
		delim = " / "
	}
	if t.AlbumArtist != nil && t.Artist != nil && *t.AlbumArtist != *t.Artist {
		s += delim + *t.Artist
		delim = " / "
	}
	if t.Name != nil {
		s += delim + *t.Name
	}
	return s
}

type stimes []Time
func (s stimes) Len() int { return len(s) }
func (s stimes) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s stimes) Less(i, j int) bool { return s[i] < s[j] }

func (t *Track) ModDate() time.Time {
	times := []Time{}
	if t.DateModified != nil {
		times = append(times, *t.DateModified)
	}
	if t.DateAdded != nil {
		times = append(times, *t.DateAdded)
	}
	if t.PlayDate != nil {
		times = append(times, *t.PlayDate)
	}
	if t.SkipDate != nil {
		times = append(times, *t.SkipDate)
	}
	if len(times) == 0 {
		return time.Date(2999, time.December, 31, 23, 59, 59, 999999999, time.UTC)
	}
	sort.Sort(stimes(times))
	return times[len(times) - 1].Time()
}

func (t *Track) Path() string {
	if t.Location == nil {
		return ""
	}
	finder := GetGlobalFinder()
	if finder != nil {
		fn, err := finder.FindFile(*t.Location, t.Homedir)
		if err == nil {
			return fn
		}
	}
	return *t.Location
}

func (t *Track) ContentType() string {
	switch strings.ToLower(filepath.Ext(t.Path())) {
	case ".mp3":
		return "audio/mpeg"
	case ".m4a":
		return "audio/mp4a-latm"
	case ".mp4":
		return "audio/mp4a-latm"
	case ".wav":
		return "audio/x-wav"
	case ".ogg":
		return "audio/ogg"
	case ".flac":
		return "audio/x-flac"
	case ".aac":
		return "audio/x-aac"
	case ".weba":
		return "audio/webm"
	case ".wma":
		return "audio/x-ms-wma"
	}
	return "audio/mpeg"
}

func (t *Track) getTag() (tag.Metadata, error) {
	fn := t.Path()
	f, err := os.Open(fn)
	if f != nil {
		defer f.Close()
	}
	if err != nil {
		return nil, errors.Wrap(err, "can't open track file " + fn)
	}
	m, err := tag.ReadFrom(f)
	if err != nil {
		return nil, errors.Wrap(err, "can't read tag data from " + fn)
	}
	return m, nil
}

func (t *Track) GetPurchaseDate() (*Time, error) {
	if t.PurchaseDate != nil {
		return t.PurchaseDate, nil
	}
	if !t.Purchased {
		return nil, nil
	}
	m, err := t.getTag()
	if err != nil {
		return nil, err
	}
	d := m.Raw()
	v, ok := d["purd"]
	if !ok {
		return nil, nil
	}
	tm, err := time.Parse("2006-01-02 15:04:05", v.(string))
	if err != nil {
		return nil, errors.Wrap(err, "can't parse time value " + v.(string))
	}
	ms := Time(tm.Unix() * 1000 + int64((tm.Nanosecond() / 1e6)))
	t.PurchaseDate = &ms
	return t.PurchaseDate, nil
}

func (t *Track) GetName() (string, error) {
	if t.Name != nil {
		return *t.Name, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Title()
	if v != "" {
		t.Name = &v
		return v, nil
	}
	fn := t.Path()
	_, name := filepath.Split(fn)
	ext := filepath.Ext(fn)
	name = strings.TrimSuffix(name, ext)
	name = strings.Replace(name, "_", " ", -1)
	reg := regexp.MustCompile(`^\d+(\.\d+)[ \.\-]\s*`)
	name = reg.ReplaceAllString(name, "")
	t.Name = &name
	return name, nil
}

func (t *Track) GetAlbum() (string, error) {
	if t.Album != nil {
		return *t.Album, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Album()
	if v != "" {
		t.Album = &v
		return v, nil
	}
	fn := t.Path()
	dir, _ := filepath.Split(fn)
	_, name := filepath.Split(dir)
	name = strings.Replace(name, "_", " ", -1)
	t.Album = &name
	return name, nil
}

func (t *Track) GetArtist() (string, error) {
	if t.Artist != nil {
		return *t.Artist, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Artist()
	if v != "" {
		t.Artist = &v
		return v, nil
	}
	fn := t.Path()
	dir, _ := filepath.Split(fn)
	dir, _ = filepath.Split(dir)
	_, name := filepath.Split(dir)
	name = strings.Replace(name, "_", " ", -1)
	t.Artist = &name
	return name, nil
}

func (t *Track) GetAlbumArtist() (string, error) {
	if t.AlbumArtist != nil {
		return *t.AlbumArtist, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.AlbumArtist()
	if v != "" {
		t.AlbumArtist = &v
		return v, nil
	}
	fn := t.Path()
	dir, _ := filepath.Split(fn)
	dir, _ = filepath.Split(dir)
	_, name := filepath.Split(dir)
	name = strings.Replace(name, "_", " ", -1)
	t.AlbumArtist = &name
	return name, nil
}

func (t *Track) GetComposer() (string, error) {
	if t.Composer != nil {
		return *t.Composer, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Composer()
	if v != "" {
		t.Composer = &v
		return v, nil
	}
	return "", nil
}

func (t *Track) GetGenre() (string, error) {
	if t.Genre != nil {
		return *t.Genre, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Genre()
	if v != "" {
		t.Genre = &v
		return v, nil
	}
	return "", nil
}

func (t *Track) GetTrack() (uint8, uint8, error) {
	if t.TrackNumber != nil && t.TrackCount != nil {
		return *t.TrackNumber, *t.TrackCount, nil
	}
	var tn, tc uint8
	if t.TrackNumber != nil {
		tn = *t.TrackNumber
	}
	if t.TrackCount != nil {
		tc = *t.TrackCount
	}
	m, err := t.getTag()
	if err != nil {
		return tn, tc, err
	}
	n, c := m.Track()
	if t.TrackNumber == nil && n != 0 {
		tn = uint8(n)
		t.TrackNumber = &tn
	}
	if t.TrackCount == nil && c != 0 {
		tc = uint8(c)
		t.TrackCount = &tc
	}
	return tn, tc, nil
}

func (t *Track) GetDisc() (uint8, uint8, error) {
	if t.DiscNumber != nil && t.DiscCount != nil {
		return *t.DiscNumber, *t.DiscCount, nil
	}
	var dn, dc uint8
	if t.DiscNumber != nil {
		dn = *t.DiscNumber
	}
	if t.DiscCount != nil {
		dc = *t.DiscCount
	}
	m, err := t.getTag()
	if err != nil {
		return dn, dc, err
	}
	n, c := m.Disc()
	if t.DiscNumber == nil && n != 0 {
		dn = uint8(n)
		t.DiscNumber = &dn
	}
	if t.DiscCount == nil && c != 0 {
		dc = uint8(c)
		t.DiscCount = &dc
	}
	return dn, dc, nil
}

func (t *Track) GetSize() (uint64, error) {
	if t.Size != nil {
		return *t.Size, nil
	}
	st, err := os.Stat(t.Path())
	if err != nil {
		return 0, errors.Wrap(err, "can't stat " + t.Path())
	}
	t.Size = uint64p(uint64(st.Size()))
	return *t.Size, nil
}

func (t *Track) GetTotalTime() (uint, error) {
	if t.TotalTime != nil {
		return *t.TotalTime, nil
	}
	md, err := audio.ReadMetadata(t.Path())
	if err != nil {
		return 0, errors.Wrap(err, "can't read audio metadata from " + t.Path())
	}
	t.TotalTime = uintp(uint(md.Length().Seconds() * 1000))
	return *t.TotalTime, nil
}

func (t *Track) GetSampleRate() (uint, error) {
	if t.SampleRate != nil {
		return *t.SampleRate, nil
	}
	fn := t.Path()
	codec, err := audio.Identify(fn)
	if err != nil {
		return 0, errors.Wrap(err, "can't identify audio type from " + fn)
	}
	switch codec {
	case audio.MP3:
		f, err := os.Open(fn)
		if err != nil {
			return 0, errors.Wrap(err, "can't open audio file " + fn)
		}
		dec, err := mp3.NewDecoder(f)
		if err != nil {
			return 0, errors.Wrap(err, "can't decode mp3 audio file " + fn)
		}
		t.SampleRate = uintp(uint(dec.SampleRate()))
	default:
		return 0, errors.Errorf("don't know how to get sample rate from %s", codec)
	}
	return *t.SampleRate, nil
}

func (t *Track) GetBitRate() (uint, error) {
	if t.BitRate != nil {
		return *t.BitRate, nil
	}
	md, err := audio.ReadMetadata(t.Path())
	if err != nil {
		return 0, errors.Wrap(err, "can't read audio metadata from " + t.Path())
	}
	t.BitRate = uintp(uint(md.EncodingBitrate()))
	return *t.BitRate, nil
}

func (t *Track) CanonicalPath() string {
	canre := regexp.MustCompile(`[^A-Za-z_,\.\-]`)
	parts := []string{}
	if t.AlbumArtist != nil {
		parts = append(parts, canre.ReplaceAllString(*t.AlbumArtist, "_"))
	} else if t.Compilation {
		parts = append(parts, "Various_Artists")
	} else if t.Artist != nil {
		parts = append(parts, canre.ReplaceAllString(*t.Artist, "_"))
	} else {
		parts = append(parts, "Various_Artists")
	}
	if t.Album != nil {
		parts = append(parts, canre.ReplaceAllString(*t.Album, "_"))
	} else {
		parts = append(parts, "Unknown")
	}
	name := ""
	if t.TrackNumber != nil {
		if t.DiscNumber != nil && (t.DiscCount == nil || (t.DiscCount != nil && *t.DiscCount > 1)) {
			name = fmt.Sprintf("%02d.%02d-", *t.DiscNumber, *t.TrackNumber)
		} else {
			name = fmt.Sprintf("%02d-", *t.TrackNumber)
		}
	}
	if t.Name != nil {
		name += canre.ReplaceAllString(*t.Name, "_")
	} else {
		name += "Unknown"
	}
	name += t.GetExt()
	parts = append(parts, name)
	return filepath.Join(parts...)
}

func (t *Track) GetExt() string {
	if t.Location != nil {
		return path.Ext(*t.Location)
	}
	return t.FileType.FileExtension()
}

func (t *Track) Update(orig, cur *Track) {
	mod := false
	if !stringpCompare(cur.Album, orig.Album) {
		t.Album = cur.Album
		t.SortAlbum = cur.SortAlbum
		mod = true
	}
	if !stringpCompare(cur.AlbumArtist, orig.AlbumArtist) {
		t.AlbumArtist = cur.AlbumArtist
		t.SortAlbumArtist = cur.SortAlbumArtist
		mod = true
	}
	if !stringpCompare(cur.Artist, orig.Artist) {
		t.Artist = cur.Artist
		t.SortArtist = cur.SortArtist
		mod = true
	}
	if !uintpCompare(cur.BitRate, orig.BitRate) {
		t.BitRate = cur.BitRate
		mod = true
	}
	if !uint16pCompare(cur.BPM, orig.BPM) {
		t.BPM = cur.BPM
		mod = true
	}
	if !stringpCompare(cur.Comments, orig.Comments) {
		t.Comments = cur.Comments
		mod = true
	}
	if cur.Compilation != orig.Compilation {
		t.Compilation = cur.Compilation
		mod = true
	}
	if !stringpCompare(cur.Composer, orig.Composer) {
		t.Composer = cur.Composer
		t.Composer = cur.SortComposer
		mod = true
	}
	if !uint8pCompare(cur.DiscCount, orig.DiscCount) {
		t.DiscCount = cur.DiscCount
		mod = true
	}
	if !uint8pCompare(cur.DiscNumber, orig.DiscNumber) {
		t.DiscNumber = cur.DiscNumber
		mod = true
	}
	if cur.Gapless != orig.Gapless {
		t.Gapless = cur.Gapless
		mod = true
	}
	if !stringpCompare(cur.Genre, orig.Genre) {
		t.Genre = cur.Genre
		t.SortGenre = cur.SortGenre
		mod = true
	}
	if !stringpCompare(cur.Grouping, orig.Grouping) {
		t.Grouping = cur.Grouping
		mod = true
	}
	if !stringpCompare(cur.Kind, orig.Kind) {
		t.Kind = cur.Kind
		mod = true
	}
	if !boolpCompare(cur.Loved, orig.Loved) {
		t.Loved = cur.Loved
		mod = true
	}
	if !uint8pCompare(cur.MovementCount, orig.MovementCount) {
		t.MovementCount = cur.MovementCount
		mod = true
	}
	if !stringpCompare(cur.MovementName, orig.MovementName) {
		t.MovementName = cur.MovementName
		mod = true
	}
	if !uint8pCompare(cur.MovementNumber, orig.MovementNumber) {
		t.MovementNumber = cur.MovementNumber
		mod = true
	}
	if !stringpCompare(cur.Name, orig.Name) {
		t.Name = cur.Name
		t.Name = cur.SortName
		mod = true
	}
	if !uint8pCompare(cur.Rating, orig.Rating) {
		t.Rating = cur.Rating
		mod = true
	}
	if !TimepCompare(cur.ReleaseDate, orig.ReleaseDate) {
		t.ReleaseDate = cur.ReleaseDate
		mod = true
	}
	if !uintpCompare(cur.SampleRate, orig.SampleRate) {
		t.SampleRate = cur.SampleRate
		mod = true
	}
	if !stringpCompare(cur.SortAlbum, orig.SortAlbum) {
		t.SortAlbum = cur.SortAlbum
		mod = true
	}
	if !stringpCompare(cur.SortAlbumArtist, orig.SortAlbumArtist) {
		t.SortAlbumArtist = cur.SortAlbumArtist
		mod = true
	}
	if !stringpCompare(cur.SortArtist, orig.SortArtist) {
		t.SortArtist = cur.SortArtist
		mod = true
	}
	if !stringpCompare(cur.SortComposer, orig.SortComposer) {
		t.SortComposer = cur.SortComposer
		mod = true
	}
	if !stringpCompare(cur.SortGenre, orig.SortGenre) {
		t.SortGenre = cur.SortGenre
		mod = true
	}
	if !stringpCompare(cur.SortName, orig.SortName) {
		t.SortName = cur.SortName
		mod = true
	}
	if !uint8pCompare(cur.TrackCount, orig.TrackCount) {
		t.TrackCount = cur.TrackCount
		mod = true
	}
	if !uint8pCompare(cur.TrackNumber, orig.TrackNumber) {
		t.TrackNumber = cur.TrackNumber
		mod = true
	}
	if !uint8pCompare(cur.VolumeAdjustment, orig.VolumeAdjustment) {
		t.VolumeAdjustment = cur.VolumeAdjustment
		mod = true
	}
	if !stringpCompare(cur.Work, orig.Work) {
		t.Work = cur.Work
		mod = true
	}
	if cur.PlayDate != nil {
		if t.PlayDate == nil || *cur.PlayDate > *t.PlayDate {
			t.PlayDate = cur.PlayDate
			mod = true
		}
	}
	if cur.SkipDate != nil {
		if t.SkipDate == nil || *cur.SkipDate > *t.SkipDate {
			t.SkipDate = cur.SkipDate
			mod = true
		}
	}
	if cur.PlayCount > orig.PlayCount {
		t.PlayCount += (cur.PlayCount - orig.PlayCount)
		mod = true
	}
	if cur.SkipCount > orig.SkipCount {
		t.SkipCount += (cur.SkipCount - orig.SkipCount)
		mod = true
	}
	if mod {
		t.DateModified = new(Time)
		t.DateModified.Set(time.Now().In(time.UTC))
	}
}

func (t *Track) Validate() error {
	t.GetName()
	t.GetGenre()
	s, _ := t.GetArtist()
	if s == "" {
		if s, _ = t.GetAlbumArtist(); s != "" {
			t.Artist = &s
		} else {
			t.Artist = stringp("<Unknown>")
		}
	}
	s, _ = t.GetAlbumArtist()
	if s == "" {
		t.AlbumArtist = t.Artist
	}
	t.GetComposer()
	t.GetTrack()
	t.GetDisc()
	if t.Name != nil {
		t.Name = stringp(strings.TrimSpace(*t.Name))
	}
	if t.Name != nil {
		if t.SortName == nil {
			t.SortName = stringp(MakeSort(*t.Name))
		} else {
			t.SortName = stringp(MakeSort(*t.SortName))
		}
	} else {
		t.SortName = nil
	}
	if t.Genre != nil {
		t.Genre = stringp(strings.TrimSpace(*t.Genre))
	}
	if t.Genre != nil {
		if t.SortGenre == nil {
			t.SortGenre = stringp(MakeSort(*t.Genre))
		} else {
			t.SortGenre = stringp(MakeSort(*t.SortGenre))
		}
	} else {
		t.SortGenre = nil
	}
	if t.Artist != nil {
		t.Artist = stringp(strings.TrimSpace(*t.Artist))
	}
	if t.Artist != nil {
		if t.SortArtist == nil {
			t.SortArtist = stringp(MakeSortArtist(*t.Artist))
		} else {
			t.SortArtist = stringp(MakeSortArtist(*t.SortArtist))
		}
	} else {
		t.SortArtist = nil
	}
	if t.AlbumArtist != nil {
		t.AlbumArtist = stringp(strings.TrimSpace(*t.AlbumArtist))
	}
	if t.AlbumArtist != nil {
		if t.SortAlbumArtist == nil {
			t.SortAlbumArtist = stringp(MakeSortArtist(*t.AlbumArtist))
		} else {
			t.SortAlbumArtist = stringp(MakeSortArtist(*t.SortAlbumArtist))
		}
	} else {
		t.SortAlbumArtist = nil
	}
	if t.Composer != nil {
		t.Composer = stringp(strings.TrimSpace(*t.Composer))
	}
	if t.Composer != nil {
		if t.SortComposer == nil {
			t.SortComposer = stringp(MakeSortArtist(*t.Composer))
		} else {
			t.SortComposer = stringp(MakeSortArtist(*t.SortComposer))
		}
	} else {
		t.SortComposer = nil
	}
	if t.Album != nil {
		t.Album = stringp(strings.TrimSpace(*t.Album))
	}
	if t.Album != nil {
		if t.SortAlbum == nil {
			t.SortAlbum = stringp(MakeSort(*t.Album))
		} else {
			t.SortAlbum = stringp(MakeSort(*t.SortAlbum))
		}
	} else {
		t.SortAlbum = nil
	}
	if t.Purchased && t.PurchaseDate == nil {
		_, err := t.GetPurchaseDate()
		if err != nil {
			return err
		}
	}
	if t.PlayDate == nil {
		t.PlayCount = 0
	}
	if t.SkipDate == nil {
		t.SkipCount = 0
	}
	if t.DateAdded == nil {
		if t.Purchased {
			t.DateAdded = t.PurchaseDate
		} else {
			t.DateAdded = new(Time)
			t.DateAdded.Set(time.Now().In(time.UTC))
		}
	}
	if t.DateModified == nil {
		t.DateModified = t.DateAdded
	}
	t.GetBitRate()
	t.GetSize()
	t.GetTotalTime()
	t.GetSampleRate()
	return nil
}

func timeFromTimePtr(tm *time.Time) *Time {
	if tm == nil {
		return nil
	}
	var t Time
	t.Set(*tm)
	return &t
}

func TrackFromITunes(itr *loader.Track) *Track {
	fn := itr.GetLocation()
	u, err := url.Parse(fn)
	if err == nil && u.Scheme == "file" {
		fn = GetGlobalFinder().Clean(u.Path)
	}
	tr := &Track{
		PersistentID:     PersistentID(itr.GetPersistentID()),
		Album:            itr.Album,
		AlbumArtist:      itr.AlbumArtist,
		AlbumRating:      itr.AlbumRating,
		Artist:           itr.Artist,
		BPM:              itr.BPM,
		BitRate:          itr.BitRate,
		Comments:         itr.Comments,
		Compilation:      itr.GetCompilation(),
		Composer:         itr.Composer,
		DateAdded:        timeFromTimePtr(itr.DateAdded),
		DateModified:     timeFromTimePtr(itr.DateModified),
		DiscCount:        itr.DiscCount,
		DiscNumber:       itr.DiscNumber,
		Genre:            itr.Genre,
		Kind:             itr.Kind,
		Loved:            itr.Loved,
		Name:             itr.Name,
		Gapless:          itr.GetPartOfGaplessAlbum(),
		PlayCount:        itr.GetPlayCount(),
		PlayDate:         timeFromTimePtr(itr.PlayDate),
		PurchaseDate:     timeFromTimePtr(itr.PurchaseDate),
		Purchased:        itr.GetPurchased(),
		Rating:           itr.Rating,
		ReleaseDate:      timeFromTimePtr(itr.ReleaseDate),
		SampleRate:       itr.SampleRate,
		Size:             itr.Size,
		SkipCount:        itr.GetSkipCount(),
		SkipDate:         timeFromTimePtr(itr.SkipDate),
		SortAlbum:        itr.SortAlbum,
		SortAlbumArtist:  itr.SortAlbumArtist,
		SortArtist:       itr.SortArtist,
		SortComposer:     itr.SortComposer,
		SortGenre:        itr.Genre,
		SortName:         itr.SortName,
		TotalTime:        itr.TotalTime,
		TrackCount:       itr.TrackCount,
		TrackNumber:      itr.TrackNumber,
		VolumeAdjustment: itr.VolumeAdjustment,
		Work:             itr.Work,
	}
	if fn != "" {
		tr.Location = &fn
	}
	if tr.ReleaseDate == nil && itr.Year != nil {
		tr.ReleaseDate = new(Time)
		tr.ReleaseDate.Set(time.Date(*itr.Year, time.December, 31, 23, 59, 59, 999 * 1e6, time.UTC))
	}
	if itr.GetMovie() {
		tr.MediaKind = Movie
	} else if itr.GetPodcast() {
		tr.MediaKind = Podcast
	} else if itr.GetMusicVideo() {
		tr.MediaKind = MusicVideo
	} else if itr.GetTVShow() {
		tr.MediaKind = TVShow
	} else if itr.GetHasVideo() {
		tr.MediaKind = HomeVideo
	} else if strings.HasSuffix(itr.GetLocation(), ".m4b") {
		tr.MediaKind = Audiobook
	} else {
		tr.MediaKind = Music
	}
	//tr.Validate()
	return tr
}

func TrackFromAudioFile(fn string) (*Track, error) {
	st, err := os.Stat(fn)
	if err != nil {
		return nil, errors.Wrap(err, "can't stat " + fn)
	}
	md, err := audio.ReadMetadata(fn)
	if err != nil {
		return &Track{
			Location: &fn,
			Size: uint64p(uint64(st.Size())),
		}, errors.Wrap(err, "cant read audio metadata from file " + fn)
	}
	tn, tc := md.Track()
	dn, dc := md.Disc()
	var tnp, tcp, dnp, dcp *uint8
	if tn != 0 {
		tnp = uint8p(uint8(tn))
	}
	if tc != 0 {
		tcp = uint8p(uint8(tc))
	}
	if dn != 0 {
		dnp = uint8p(uint8(dn))
	}
	if dc != 0 {
		dcp = uint8p(uint8(dc))
	}
	y := md.Year()
	var rd *Time
	if y != 0 {
		rd = new(Time)
		rd.Set(time.Date(y, time.December, 31, 23, 59, 59, 999 * 1e6, time.UTC))
	}
	tr := &Track{
		Album: stringp(md.Album()),
		AlbumArtist: stringp(md.AlbumArtist()),
		Artist: stringp(md.Artist()),
		BitRate: uintp(uint(md.EncodingBitrate())),
		Comments: stringp(md.Comment()),
		Composer: stringp(md.Composer()),
		DiscCount: dcp,
		DiscNumber: dnp,
		Genre: stringp(md.Genre()),
		Location: &fn,
		Name: stringp(md.Title()),
		ReleaseDate: rd,
		Size: uint64p(uint64(st.Size())),
		TotalTime: uintp(uint(md.Length().Nanoseconds() / 1e6)),
		TrackCount: tcp,
		TrackNumber: tnp,
		FileType: FileType(md.Encoding()),
		MediaKind: Music,
	}
	return tr, nil
}

