package itunes

import (
	//"encoding/xml"
	//"fmt"
	//"net/url"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	//"golang.org/x/text/unicode/norm"
	"github.com/dhowden/tag"
)

type Track struct {
	PersistentID         PersistentID `json:"persistent_id"`
	Album                string       `json:"album,omitempty"`
	AlbumArtist          string       `json:"album_artist,omitempty"`
	AlbumRating          uint8        `json:"album_rating,omitempty"`
	Artist               string       `json:"artist,omitempty"`
	Comments             string       `json:"comments,omitempty"`
	Compilation          bool         `json:"compilation,omitempty"`
	Composer             string       `json:"composer,omitempty"`
	DateAdded            *Time        `json:"date_added,omitempty"`
	DateModified         *Time        `json:"date_modified,omitempty"`
	DiscCount            uint8        `json:"disc_count,omitempty"`
	DiscNumber           uint8        `json:"disc_number,omitempty"`
	Genre                string       `json:"genre,omitempty"`
	Grouping             string       `json:"grouping,omitempty"`
	Kind                 string       `json:"kind,omitempty"`
	Location             string       `json:"location"`
	Loved                *bool        `json:"loved"`
	Name                 string       `json:"name,omitempty"`
	PartOfGaplessAlbum   bool         `json:"part_of_gapless_album,omitempty"`
	PlayCount            uint         `json:"play_count,omitempty"`
	PlayDateUTC          *Time        `json:"play_date_utc,omitempty"`
	Purchased            bool         `json:"purchased,omitempty"`
	PurchaseDate         *Time        `json:"purchase_date,omitempty"`
	Rating               uint8        `json:"rating,omitempty"`
	ReleaseDate          *Time        `json:"release_date,omitempty"`
	Size                 uint         `json:"size,omitempty"`
	SkipCount            uint         `json:"skip_count,omitempty"`
	SkipDate             *Time        `json:"skip_date,omitempty"`
	SortAlbum            string       `json:"sort_album,omitempty"`
	SortAlbumArtist      string       `json:"sort_album_artist,omitempty"`
	SortArtist           string       `json:"sort_artist,omitempty"`
	SortComposer         string       `json:"sort_composer,omitempty"`
	SortName             string       `json:"sort_name,omitempty"`
	TotalTime            uint         `json:"total_time,omitempty"`
	TrackCount           uint8        `json:"track_count,omitempty"`
	TrackNumber          uint8        `json:"track_number,omitempty"`
	Unplayed             bool         `json:"unplayed,omitempty"`
	VolumeAdjustment     uint8        `json:"volume_adjustment,omitempty"`
	Work                 string       `json:"work,omitempty"`
}

func (t *Track) String() string {
	s := ""
	delim := ""
	if t.AlbumArtist != "" {
		s += delim + t.AlbumArtist
		delim = " / "
	} else if t.Artist != "" {
		s += delim + t.Artist
		delim = " / "
	}
	if t.Album != "" {
		s += delim + t.Album
		delim = " / "
	}
	if t.AlbumArtist != "" && t.Artist != "" && t.AlbumArtist != t.Artist {
		s += delim + t.Artist
		delim = " / "
	}
	if t.Name != "" {
		s += delim + t.Name
	}
	return s
}

func (t *Track) MediaKind() MediaKind {
	return MediaKind_MUSIC
}

func (t *Track) ModDate() time.Time {
	if t.DateModified == nil {
		if t.DateAdded == nil {
			return time.Date(2999, time.December, 31, 23, 59, 59, 999999999, time.UTC)
		}
		return t.DateAdded.Get()
	}
	if t.DateAdded == nil {
		return t.DateModified.Get()
	}
	at := t.DateAdded.Get()
	mt := t.DateModified.Get()
	if at.After(mt) {
		return at
	}
	return mt
}

func (t *Track) Path() string {
	if t.Location == "" {
		return ""
	}
	finder := GetGlobalFinder()
	if finder != nil {
		fn, err := finder.FindFile(t.Location)
		if err == nil {
			return fn
		}
	}
	return t.Location
}

func (t *Track) getTag() (tag.Metadata, error) {
	fn := t.Path()
	f, err := os.Open(fn)
	if f != nil {
		defer f.Close()
	}
	if err != nil {
		return nil, err
	}
	m, err := tag.ReadFrom(f)
	if err != nil {
		return nil, err
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
		return nil, err
	}
	t.PurchaseDate = &Time{tm}
	return t.PurchaseDate, nil
}

func (t *Track) GetName() (string, error) {
	if t.Name != "" {
		return t.Name, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Title()
	if v != "" {
		t.Name = v
		return v, nil
	}
	fn := t.Path()
	_, name := filepath.Split(fn)
	ext := filepath.Ext(fn)
	name = strings.TrimSuffix(name, ext)
	name = strings.Replace(name, "_", " ", -1)
	reg := regexp.MustCompile(`^\d+(\.\d+)[ \.\-]\s*`)
	name = reg.ReplaceAllString(name, "")
	t.Name = name
	return name, nil
}

func (t *Track) GetAlbum() (string, error) {
	if t.Album != "" {
		return t.Album, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Album()
	if v != "" {
		t.Album = v
		return v, nil
	}
	fn := t.Path()
	dir, _ := filepath.Split(fn)
	_, name := filepath.Split(dir)
	name = strings.Replace(name, "_", " ", -1)
	t.Album = name
	return name, nil
}

func (t *Track) GetArtist() (string, error) {
	if t.Artist != "" {
		return t.Artist, nil
	}
	m, err := t.getTag()
	if err != nil {
		return "", err
	}
	v := m.Artist()
	if v != "" {
		t.Artist = v
		return v, nil
	}
	fn := t.Path()
	dir, _ := filepath.Split(fn)
	dir, _ = filepath.Split(dir)
	_, name := filepath.Split(dir)
	name = strings.Replace(name, "_", " ", -1)
	t.Artist = name
	return name, nil
}

var kindExt = map[string]string{
	"Purchased AAC audio file": ".m4a",
	"Protected AAC audio file": ".m4p",
	"MPEG audio file": ".mp3",
	"WAV audio file": ".wav",
	"MPEG-4 video file": ".m4v",
	"Protected MPEG-4 video file": ".m4v",
	"Purchased MPEG-4 video file": ".m4v",
	"QuickTime movie file": ".mov",
}

func (t *Track) GetExt() string {
	if t.Location != "" {
		return path.Ext(t.Location)
	}
	if t.Kind != "" {
		ext, ok := kindExt[t.Kind]
		if ok {
			return ext
		}
	}
	return ""
}
