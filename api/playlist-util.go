package api

import (
	"fmt"
	"html"
	"strings"

	"github.com/rclancey/synos/musicdb"
)

func m3uEscape(s string) string {
	s = html.EscapeString(s)
	s = strings.Replace(s, "&#39;", "", -1)
	s = strings.Replace(s, "&amp;", "&#38;", -1)
	s = strings.Replace(s, "&lt;", "&#60;", -1)
	s = strings.Replace(s, "&gt;", "&#62;", -1)
	return s
}

func M3U(tracks []*musicdb.Track) ([]string, error) {
	lines := make([]string, len(tracks) * 2 + 2)
	lines[0] = "#EXTM3U"
	for i, track := range tracks {
		if track == nil {
			continue
		}
		var t uint
		var album, artist, song string
		if track.TotalTime != nil {
			t = *track.TotalTime / 1000
		}
		if track.Album != nil {
			album = *track.Album
		}
		if track.Artist != nil {
			artist = *track.Artist
		}
		if track.Name != nil {
			song = *track.Name
		}
		u := cfg.Bind.RootURL(cfg.Sonos, false)
		u.Path = fmt.Sprintf("/api/track/%s%s", track.PersistentID.String(), track.GetExt())
		lines[i * 2 + 1] = fmt.Sprintf("#EXTINF:%d,<%s><%s><%s>", t, m3uEscape(artist), m3uEscape(album), m3uEscape(song))
		lines[i * 2 + 2] = u.String()
	}
	return lines, nil
}

func boolptr(v bool) *bool {
	return &v
}

