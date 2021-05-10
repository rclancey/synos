package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	H "github.com/rclancey/httpserver"
	"musicdb"
)

func stringp(v string) *string { return &v }
func uint8p(v uint8) *uint8 { return &v }

func TrackInfoFromHeader(req *http.Request, track *musicdb.Track) {
	s := req.Header.Get("X-Album-Artist")
	if s != "" {
		track.AlbumArtist = stringp(s)
	}
	s = req.Header.Get("X-Album")
	if s != "" {
		track.Album = stringp(s)
	}
	s = req.Header.Get("X-Artist")
	if s != "" {
		track.Artist = stringp(s)
	}
	s = req.Header.Get("X-Composer")
	if s != "" {
		track.Composer = stringp(s)
	}
	s = req.Header.Get("X-Song-Title")
	if s != "" {
		track.Name = stringp(s)
	}
	s = req.Header.Get("X-Genre")
	if s != "" {
		track.Genre = stringp(s)
	}
	s = req.Header.Get("X-Release-Date")
	if s != "" {
		tm, err := time.Parse("2006-01-02", s)
		if err == nil {
			track.ReleaseDate = new(musicdb.Time)
			track.ReleaseDate.Set(tm)
		}
	}
	s = req.Header.Get("X-Disc-Number")
	if s != "" {
		parts := strings.Split(s, "/")
		if len(parts) > 0 {
			n, err := strconv.Atoi(strings.TrimSpace(parts[0]))
			if err == nil {
				track.DiscNumber = uint8p(uint8(n))
			}
		}
		if len(parts) > 1 {
			n, err := strconv.Atoi(strings.TrimSpace(parts[1]))
			if err == nil {
				track.DiscCount = uint8p(uint8(n))
			}
		}
	}
	s = req.Header.Get("X-Track-Number")
	if s != "" {
		parts := strings.Split(s, "/")
		if len(parts) > 0 {
			n, err := strconv.Atoi(strings.TrimSpace(parts[0]))
			if err == nil {
				track.TrackNumber = uint8p(uint8(n))
			}
		}
		if len(parts) > 1 {
			n, err := strconv.Atoi(strings.TrimSpace(parts[1]))
			if err == nil {
				track.TrackCount = uint8p(uint8(n))
			}
		}
	}
}

func ApplyTrackUpdates(tracks []*musicdb.Track, update map[string]interface{}) error {
	raw, err := json.Marshal(update)
	if err != nil {
		return err
	}
	tup := &musicdb.Track{}
	err = json.Unmarshal(raw, tup)
	if err != nil {
		return H.BadRequest.Wrap(err, "Malformed JSON input")
	}
	_, ok := update["album"]
	if ok {
		for _, tr := range tracks {
			tr.Album = tup.Album
			tr.SortAlbum = tup.SortAlbum
		}
	} else {
		_, ok = update["sort_album"]
		if ok {
			for _, tr := range tracks {
				tr.SortAlbum = tup.SortAlbum
			}
		}
	}
	_, ok = update["album_artist"]
	if ok {
		for _, tr := range tracks {
			tr.AlbumArtist = tup.AlbumArtist
			tr.SortAlbumArtist = tup.SortAlbumArtist
		}
	} else {
		_, ok = update["sort_album_artist"]
		if ok {
			for _, tr := range tracks {
				tr.SortAlbumArtist = tup.SortAlbumArtist
			}
		}
	}
	_, ok = update["artist"]
	if ok {
		for _, tr := range tracks {
			tr.Artist = tup.Artist
			tr.SortArtist = tup.SortArtist
		}
	} else {
		_, ok = update["sort_artist"]
		if ok {
			for _, tr := range tracks {
				tr.SortArtist = tup.SortArtist
			}
		}
	}
	_, ok = update["composer"]
	if ok {
		for _, tr := range tracks {
			tr.Composer = tup.Composer
			tr.SortComposer = tup.SortComposer
		}
	} else {
		_, ok = update["sort_composer"]
		if ok {
			for _, tr := range tracks {
				tr.SortComposer = tup.SortComposer
			}
		}
	}
	_, ok = update["name"]
	if ok {
		for _, tr := range tracks {
			tr.Name = tup.Name
			tr.SortName = tup.SortName
		}
	} else {
		_, ok = update["sort_name"]
		if ok {
			for _, tr := range tracks {
				tr.SortName = tup.SortName
			}
		}
	}
	_, ok = update["track_number"]
	if ok {
		for _, tr := range tracks {
			tr.TrackNumber = tup.TrackNumber
		}
	}
	_, ok = update["track_count"]
	if ok {
		for _, tr := range tracks {
			tr.TrackCount = tup.TrackCount
		}
	}
	_, ok = update["disc_number"]
	if ok {
		for _, tr := range tracks {
			tr.DiscNumber = tup.DiscNumber
		}
	}
	_, ok = update["disc_count"]
	if ok {
		for _, tr := range tracks {
			tr.DiscCount = tup.DiscCount
		}
	}
	_, ok = update["release_date"]
	if ok {
		for _, tr := range tracks {
			tr.ReleaseDate = tup.ReleaseDate
		}
	}
	_, ok = update["compilation"]
	if ok {
		for _, tr := range tracks {
			tr.Compilation = tup.Compilation
		}
	}
	_, ok = update["rating"]
	if ok {
		for _, tr := range tracks {
			tr.Rating = tup.Rating
		}
	}
	_, ok = update["loved"]
	if ok {
		for _, tr := range tracks {
			tr.Loved = tup.Loved
		}
	}
	_, ok = update["bpm"]
	if ok {
		for _, tr := range tracks {
			tr.BPM = tup.BPM
		}
	}
	_, ok = update["grouping"]
	if ok {
		for _, tr := range tracks {
			tr.Grouping = tup.Grouping
		}
	}
	_, ok = update["genre"]
	if ok {
		for _, tr := range tracks {
			tr.Genre = tup.Genre
		}
	}
	_, ok = update["comments"]
	if ok {
		for _, tr := range tracks {
			tr.Comments = tup.Comments
		}
	}
	_, ok = update["volume_adjustment"]
	if ok {
		for _, tr := range tracks {
			tr.VolumeAdjustment = tup.VolumeAdjustment
		}
	}
	_, ok = update["work"]
	if ok {
		for _, tr := range tracks {
			tr.Work = tup.Work
		}
	}
	_, ok = update["movement_count"]
	if ok {
		for _, tr := range tracks {
			tr.MovementCount = tup.MovementCount
		}
	}
	_, ok = update["movement_name"]
	if ok {
		for _, tr := range tracks {
			tr.MovementName = tup.MovementName
		}
	}
	_, ok = update["movement_number"]
	if ok {
		for _, tr := range tracks {
			tr.MovementNumber = tup.MovementNumber
		}
	}
	_, ok = update["gapless"]
	if ok {
		for _, tr := range tracks {
			tr.Gapless = tup.Gapless
		}
	}
	_, ok = update["artwork_url"]
	if ok {
		for _, tr := range tracks {
			tr.ArtworkURL = tup.ArtworkURL
		}
	}
	modTime := new(musicdb.Time)
	modTime.Set(time.Now().In(time.UTC))
	for _, tr := range tracks {
		tr.DateModified = modTime
		tr.Validate()
	}
	return nil
}

