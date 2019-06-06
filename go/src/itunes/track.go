package itunes

import (
	"encoding/xml"
	//"fmt"
	"os"
	"path/filepath"
	"regexp"
	"time"
	"strings"
	"net/url"
	"path"

	"golang.org/x/text/unicode/norm"
	"github.com/dhowden/tag"
)

type Track struct {
	PersistentID         PersistentID `json:"persistent_id"`
	Album                *string      `json:"album,omitempty"`
	AlbumArtist          *string      `json:"album_artist,omitempty"`
	AlbumRating          *int         `json:"album_rating,omitempty"`
	AlbumRatingComputed  *bool        `json:"album_rating_computed,omitempty"`
	Artist               *string      `json:"artist,omitempty"`
	ArtworkCount         *int         `json:"artwork_count,omitempty"`
	BPM                  *int         `json:"bpm,omitempty"`
	BitRate              *int         `json:"bit_rate,omitempty"`
	Clean                *bool        `json:"clean,omitempty"`
	Comments             *string      `json:"comments,omitempty"`
	Compilation          *bool        `json:"compilation,omitempty"`
	Composer             *string      `json:"composer,omitempty"`
	ContentRating        *string      `json:"content_rating,omitempty"`
	Date                 *Time        `json:"date,omitempty"`
	DateAdded            *Time        `json:"date_added,omitempty"`
	DateModified         *Time        `json:"date_modified,omitempty"`
	Disabled             *bool        `json:"disabled,omitempty"`
	DiscCount            *int         `json:"disc_count,omitempty"`
	DiscNumber           *int         `json:"disc_number,omitempty"`
	Episode              *string      `json:"episode,omitempty"`
	EpisodeOrder         *int         `json:"episode_order,omitempty"`
	Explicit             *bool        `json:"explicit,omitempty"`
	FileFolderCount      *int         `json:"file_folder_count,omitempty"`
	FileType             *int         `json:"file_type,omitempty"`
	Genre                *string      `json:"genre,omitempty"`
	Grouping             *string      `json:"grouping,omitempty"`
	HasVideo             *bool        `json:"has_video,omitempty"`
	Kind                 *string      `json:"kind,omitempty"`
	LibraryFolderCount   *int         `json:"library_folder_count,omitempty"`
	Location             *string      `json:"location"`
	Loved                *bool        `json:"loved"`
	Master               *bool        `json:"master,omitempty"`
	Movie                *bool        `json:"movie,omitempty"`
	MusicVideo           *bool        `json:"music_video,omitempty"`
	Name                 *string      `json:"name,omitempty"`
	PartOfGaplessAlbum   *bool        `json:"part_of_gapless_album,omitempty"`
	PlayCount            *int         `json:"play_count,omitempty"`
	PlayDate             *int         `json:"play_date,omitempty"`
	PlayDateUTC          *Time        `json:"play_date_utc,omitempty"`
	Podcast              *bool        `json:"podcast,omitempty"`
	Protected            *bool        `json:"protected,omitempty"`
	Purchased            *bool        `json:"purchased,omitempty"`
	PurchaseDate         *Time        `json:"purchase_date,omitempty"`
	Rating               *int         `json:"rating,omitempty"`
	RatingComputed       *bool        `json:"rating_computed,omitempty"`
	ReleaseDate          *Time        `json:"release_date,omitempty"`
	SampleRate           *int         `json:"sample_rate,omitempty"`
	Season               *int         `json:"season,omitempty"`
	Series               *string      `json:"series,omitempty"`
	Size                 *int         `json:"size,omitempty"`
	SkipCount            *int         `json:"skip_count,omitempty"`
	SkipDate             *Time        `json:"skip_date,omitempty"`
	SortAlbum            *string      `json:"sort_album,omitempty"`
	SortAlbumArtist      *string      `json:"sort_album_artist,omitempty"`
	SortArtist           *string      `json:"sort_artist,omitempty"`
	SortComposer         *string      `json:"sort_composer,omitempty"`
	SortName             *string      `json:"sort_name,omitempty"`
	SortSeries           *string      `json:"sort_series,omitempty"`
	StopTime             *int         `json:"stop_time,omitempty"`
	TVShow               *bool        `json:"tv_show,omitempty"`
	TotalTime            *int         `json:"total_time,omitempty"`
	TrackCount           *int         `json:"track_count,omitempty"`
	TrackID              *int         `json:"track_id,omitempty"`
	TrackNumber          *int         `json:"track_number,omitempty"`
	TrackType            *string      `json:"track_type,omitempty"`
	Unplayed             *bool        `json:"unplayed,omitempty"`
	VolumeAdjustment     *int         `json:"volume_adjustment,omitempty"`
	Work                 *string      `json:"work,omitempty"`
	Year                 *int         `json:"year,omitempty"`
	finder               *FileFinder
}

func (t *Track) SetFinder(finder *FileFinder) {
	t.finder = finder
}

func (t *Track) Set(key []byte, kind string, val []byte) {
	SetField(t, key, kind, val)
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

func (t *Track) MediaKind() MediaKind {
	if t.MusicVideo != nil && *t.MusicVideo {
		return MediaKind_MUSICVIDEO
	}
	if t.Podcast != nil && *t.Podcast {
		return MediaKind_PODCAST
	}
	if t.Movie != nil && *t.Movie {
		return MediaKind_MOVIE
	}
	if t.TVShow != nil && *t.TVShow {
		return MediaKind_TVSHOW
	}
	if t.HasVideo != nil && *t.HasVideo {
		return MediaKind_HOMEVIDEO
	}
	if t.GetExt() == ".m4b" {
		return MediaKind_AUDIOBOOK
	}
	return MediaKind_MUSIC
	// TODO:
	/*
		"ITunesExtras": 65536,
		"VoiceMemo": 1048576,
		"ITunesU": 2097152,
		"Book": 12582912,
		"BookOrAudiobook": 12582920,
		"OtherMusic": 1057201,
		"UndesiredMusic": 2129924,
		"UndesiredOther": 2138116
	*/
}

func (t *Track) Parse(dec *xml.Decoder, id []byte) error {
	var key, val []byte
	isKey := false
	isVal := false
	for {
		tk, err := dec.Token()
		if err != nil {
			return err
		}
		switch se := tk.(type) {
		case xml.StartElement:
			if se.Name.Local == "key" {
				isKey = true
				key = []byte{}
			} else {
				isVal = true
				val = []byte{}
			}
		case xml.EndElement:
			switch se.Name.Local {
			case "key":
				isKey = false
			case "dict":
				return nil
			default:
				t.Set(key, se.Name.Local, val)
				isVal = false
			}
		case xml.CharData:
			if isKey {
				key = append(key, []byte(se)...)
			} else if isVal {
				val = append(val, []byte(se)...)
			}
		}
	}
	return nil
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

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func (t *Track) Path() string {
	if t.Location == nil {
		return ""
	}
	u, err := url.Parse(*t.Location)
	if err != nil {
		return ""
	}
	if t.finder != nil {
		fn, err := t.finder.FindFile(u.Path)
		if err == nil {
			return fn
		}
	}
	repls := []string{
		u.Path,
		strings.Replace(u.Path, "/Volumes/MultiMedia/", "/Volumes/music/", 1),
		strings.Replace(u.Path, "/Volumes/MultiMedia/", "/volume1/music/", 1),
		strings.Replace(u.Path, "/Volumes/Video/", "/volume1/video/", 1),
		strings.Replace(u.Path, "/Volumes/", "/volume1/", 1),
		strings.Replace(u.Path, "/Users/rclancey/", "/volume1/music/", 1),
		strings.Replace(u.Path, "/Users/rclancey/", "/volume1/homes/rclancey", 1),
		strings.Replace(u.Path, "/Users/rclancey/", "/volume1/homes/rclancey/nocode/rclancey/", 1),
		strings.Replace(u.Path, "/Users/rclancey/", "/volume1/homes/rclancey/dogfish/rclancey/", 1),
	}
	norms := []norm.Form{
		norm.NFC,
		norm.NFD,
		norm.NFKC,
		norm.NFKD,
	}
	for _, path := range repls {
		if exists(path) {
			return path
		}
		for _, nrm := range norms {
			npath := nrm.String(path)
			if exists(npath) {
				return npath
			}
		}
	}
	return u.Path
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
	if t.Purchased == nil || *t.Purchased == false {
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
	if t.Name != nil && *t.Name != "" {
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
	if t.Album != nil && *t.Album != "" {
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
	if t.Artist != nil && *t.Artist != "" {
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
	if t.Location != nil {
		u, err := url.Parse(*t.Location)
		if err == nil {
			return path.Ext(u.Path)
		}
	}
	if t.Kind != nil {
		ext, ok := kindExt[*t.Kind]
		if ok {
			return ext
		}
	}
	return ""
}
