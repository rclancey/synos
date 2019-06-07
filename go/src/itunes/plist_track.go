package itunes

import (
	"encoding/xml"
	//"fmt"
	"net/url"
	"time"
)

type PlistTrack struct {
	Track
	AlbumRatingComputed  bool
	ArtworkCount         int
	BPM                  int
	BitRate              int
	Clean                bool
	ContentRating        string
	Disabled             bool
	Episode              string
	EpisodeOrder         int
	Explicit             bool
	FileFolderCount      int
	FileType             int
	HasVideo             bool
	LibraryFolderCount   int
	Master               bool
	Movie                bool
	MusicVideo           bool
	PlayDate             int
	Podcast              bool
	Protected            bool
	RatingComputed       bool
	SampleRate           int
	Season               int
	Series               string
	SortSeries           string
	StopTime             int
	TVShow               bool
	TrackID              int
	TrackType            string
	Year                 int
}

func (t *PlistTrack) Set(key []byte, kind string, val []byte) {
	SetField(t, key, kind, val)
}

func (t *PlistTrack) MediaKind() MediaKind {
	if t.MusicVideo {
		return MediaKind_MUSICVIDEO
	}
	if t.Podcast {
		return MediaKind_PODCAST
	}
	if t.Movie {
		return MediaKind_MOVIE
	}
	if t.TVShow {
		return MediaKind_TVSHOW
	}
	if t.HasVideo {
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

func (t *PlistTrack) Parse(dec *xml.Decoder, id []byte) error {
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

func (t *PlistTrack) ToTrack() *Track {
	if t.Protected {
		return nil
	}
	if t.Location == "" {
		return nil
	}
	if t.TrackType != "File" {
		return nil
	}
	if t.MediaKind() != MediaKind_MUSIC {
		return nil
	}
	tr := t.Track
	if tr.ReleaseDate == nil && t.Year != 0 {
		tm := time.Date(t.Year, time.December, 31, 23, 59, 59, 999000000, time.UTC)
		tr.ReleaseDate = &Time{tm}
	}
	u, err := url.Parse(t.Location)
	if err == nil {
		finder := GetGlobalFinder()
		if finder != nil {
			tr.Location = finder.Clean(u.Path)
		} else {
			tr.Location = u.Path
		}
	}
	return &tr
}
