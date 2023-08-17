package api

import (
	"log"
	"net/http"
	"sort"
	"time"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/synos/musicdb"
)

func RecentsAPI(router H.Router, authmw H.Middleware) {
	router.GET("/recents", authmw(H.HandlerFunc(ListRecents)))
}

type Album struct {
	Artist string `json:"artist"`
	Album string `json:"album"`
	Tracks []*musicdb.Track `json:"tracks"`
}

type albumKey struct {
	Artist string
	Album string
}

type RecentItem struct {
	Type string `json:"type"`
	DateAdded *musicdb.Time `json:"date_added"`
	Track *musicdb.Track `json:"track,omitempty"`
	Album *Album `json:"album,omitempty"`
	Playlist *musicdb.Playlist `json:"playlist,omitempty"`
}

func ListRecents(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	user := getUser(r)
	since := musicdb.FromTime(time.Now().AddDate(-1, 0, 0))
	start := time.Now()
	tracks, err := db.RecentTracks(user, since)
	if err != nil {
		return nil, err
	}
	end := time.Now()
	log.Printf("%d recent tracks loaded in %s", len(tracks), end.Sub(start))
	start = time.Now()
	playlists, err := db.RecentPlaylists(user, since)
	if err != nil {
		return nil, err
	}
	end = time.Now()
	log.Printf("%d recent playlists loaded in %s", len(playlists), end.Sub(start))
	recents := []*RecentItem{}
	albums := map[albumKey]*Album{}
	start = time.Now()
	for _, t := range tracks {
		/*
		recents = append(recents, &RecentItem{
			Type: "track",
			DateAdded: t.DateAdded,
			Track: t,
		})
		*/
		key := albumKey{}
		if t.AlbumArtist != nil && *t.AlbumArtist != "" {
			/*
			if t.SortAlbumArtist != nil && *t.SortAlbumArtist != "" {
				key.Artist = *t.SortAlbumArtist
			} else {
				key.Artist = *t.AlbumArtist
			}
			*/
			key.Artist = *t.AlbumArtist
		} else if t.Artist != nil && *t.Artist != "" {
			/*
			if t.SortArtist != nil && *t.SortArtist != "" {
				key.Artist = *t.SortArtist
			} else {
				key.Artist = *t.Artist
			}
			*/
			key.Artist = *t.Artist
		}
		if t.Album != nil && *t.Album != "" {
			/*
			if t.SortAlbum != nil && *t.SortAlbum != "" {
				key.Album = *t.SortAlbum
			} else {
				key.Album = *t.Album
			}
			*/
			key.Album = *t.Album
		}
		album, ok := albums[key]
		if !ok {
			album = &Album{
				Tracks: []*musicdb.Track{},
			}
			if t.AlbumArtist != nil && *t.AlbumArtist != "" {
				album.Artist = *t.AlbumArtist
			} else if t.Artist != nil && *t.Artist != "" {
				album.Artist = *t.Artist
			}
			if t.Album != nil && *t.Album != "" {
				album.Album = *t.Album
			}
			albums[key] = album
			recents = append(recents, &RecentItem{
				Type: "album",
				DateAdded: t.DateAdded,
				Album: album,
			})
		}
		album.Tracks = append(album.Tracks, t)
	}
	end = time.Now()
	log.Printf("collected %d albums in %s", len(albums), end.Sub(start))
	start = time.Now()
	for _, pl := range playlists {
		tracks, err := db.PlaylistTracks(pl)
		if err != nil {
			continue
		}
		pl.PlaylistItems = tracks
		recents = append(recents, &RecentItem{
			Type: "playlist",
			DateAdded: pl.DateAdded,
			Playlist: pl,
		})
	}
	end = time.Now()
	log.Printf("collected %d playlists in %s", len(playlists), end.Sub(start))
	start = time.Now()
	for _, album := range albums {
		sort.Slice(album.Tracks, func(i, j int) bool {
			a := album.Tracks[i]
			b := album.Tracks[j]
			if a.DiscNumber != nil && b.DiscNumber != nil {
				if *a.DiscNumber < *b.DiscNumber {
					return true
				}
				if *a.DiscNumber > *b.DiscNumber {
					return false
				}
			} else if a.DiscNumber != nil {
				return false
			} else if b.DiscNumber != nil {
				return true
			}
			if a.TrackNumber != nil && b.TrackNumber != nil {
				if *a.TrackNumber < *b.TrackNumber {
					return true
				}
				if *a.TrackNumber > *b.TrackNumber {
					return false
				}
			} else if a.TrackNumber != nil {
				return false
			} else if b.TrackNumber != nil {
				return true
			}
			if a.Name != nil && b.Name != nil {
				if *a.Name < *b.Name {
					return true
				}
				if *a.Name > *b.Name {
					return false
				}
			}
			return a.PersistentID < b.PersistentID
		})
	}
	sort.Slice(recents, func(i, j int) bool {
		a := recents[i]
		b := recents[j]
		if a.DateAdded != nil && b.DateAdded != nil {
			return *a.DateAdded > *b.DateAdded
		}
		return false
	})
	end = time.Now()
	log.Printf("sorted %d items in %s", len(recents), end.Sub(start))
	return recents, nil
}
