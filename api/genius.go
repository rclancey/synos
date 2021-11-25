package api

import (
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"time"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/itunes/persistentId"
	"github.com/rclancey/spotify"
	"github.com/rclancey/synos/musicdb"
)

func GeniusAPI(router H.Router, authmw H.Middleware) {
	router.GET("/tracks", authmw(H.HandlerFunc(MakeGeniusPlaylist)))
	router.GET("/genres", authmw(H.HandlerFunc(GeniusMixGenres)))
	router.POST("/mix/:genre", authmw(H.HandlerFunc(MakeGeniusMix)))
	router.GET("/artists", authmw(H.HandlerFunc(MakeArtistMix)))
}

func MakeGeniusPlaylist(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	names := []string{}
	tracks := []*musicdb.Track{}
	seed := []interface{}{}
	for _, sid := range r.URL.Query()["trackId"] {
		var id pid.PersistentID
		idp := &id
		err := idp.Decode(sid)
		if err != nil {
			return nil, H.BadRequest
		}
		tr, err := db.GetTrack(*idp)
		if err != nil {
			return nil, err
		}
		if tr != nil {
			seed = append(seed, tr.AsSpotify())
			tracks = append(tracks, tr)
			names = append(names, *tr.Name)
		}
	}
	if len(seed) == 0 {
		return nil, H.NotFound
	}
	if len(seed) > 5 {
		seed = seed[:5]
	}
	res, err := spot.Recommend(seed...)
	if err != nil {
		return nil, err
	}
	for _, str := range res.Tracks {
		tr, err := db.FindSpotifyTrack(str)
		if err != nil {
			return nil, err
		}
		if tr != nil {
			tracks = append(tracks, tr)
			if len(tracks) >= 50 {
				break
			}
		}
	}
	trackIds := make([]pid.PersistentID, len(tracks))
	for i, tr := range tracks {
		trackIds[i] = tr.PersistentID
	}
	playlist := &musicdb.Playlist{
		PersistentID: 0,
		OwnerID: 0,
		Shared: false,
		Kind: musicdb.GeniusPlaylist,
		Folder: false,
		Name: strings.Join(names, " / "),
		DateAdded: nil,
		DateModified: nil,
		Smart: nil,
		GeniusTrackID: &trackIds[0],
		TrackIDs: trackIds,
		PlaylistItems: tracks,
		SortField: "",
	}
	cacheFor(w, time.Hour * 24)
	return playlist, nil
}

func GeniusMixGenres(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	genres, err := spot.RecommendationGenres()
	return genres, err
}

func capitalize(word string) string {
	if len(word) <= 1 {
		return strings.ToUpper(word)
	}
	return strings.ToUpper(word[:1]) + strings.ToLower(word[1:])
}

func MakeGeniusMix(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	genre := pathVar(r, "genre")
	args := spotify.MixArgs{}
	err := H.ReadJSON(r, &args)
	if err != nil {
		return nil, err
	}
	titleWords := strings.Split(genre, "-")
	for i, word := range titleWords {
		titleWords[i] = capitalize(word)
	}
	title := strings.Join(titleWords, " ")
	res, err := spot.Mix(genre, args)
	if err != nil {
		return nil, err
	}
	tracks := []*musicdb.Track{}
	for _, str := range res.Tracks {
		tr, err := db.FindSpotifyTrack(str)
		if err != nil {
			return nil, err
		}
		if tr != nil {
			tracks = append(tracks, tr)
			if len(tracks) >= 50 {
				break
			}
		}
	}
	trackIds := make([]pid.PersistentID, len(tracks))
	for i, tr := range tracks {
		trackIds[i] = tr.PersistentID
	}
	playlist := &musicdb.Playlist{
		PersistentID: 0,
		OwnerID: 0,
		Shared: false,
		Kind: musicdb.MixPlaylist,
		Folder: false,
		Name: title,
		DateAdded: nil,
		DateModified: nil,
		Smart: nil,
		GeniusTrackID: nil,
		TrackIDs: trackIds,
		PlaylistItems: tracks,
		SortField: "",
	}
	cacheFor(w, time.Hour * 24)
	return playlist, nil
}

type ArtistMixQuery struct {
	Seed []string `url:"artist"`
	MaxArtists int `url:"maxArtists"`
	MaxTracksPerArtist int `url:"maxTracksPerArtist"`
	MaxTracks int `url:"maxTracks"`
	MinRating int `url:"minRating"`
}

func MakeArtistMix(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	params := &ArtistMixQuery{
		MaxArtists: 10,
		MaxTracksPerArtist: 10,
		MaxTracks: 50,
		MinRating: 50,
	}
	err := H.QueryScan(r, params)
	if err != nil {
		return nil, err
	}
	if params.MaxTracks > 500 {
		params.MaxTracks = 500
	}
	if params.MaxTracksPerArtist > params.MaxTracks / 4 {
		params.MaxTracksPerArtist = params.MaxTracks / 4
	}
	if params.MaxArtists > params.MaxTracks {
		params.MaxArtists = params.MaxTracks
	}
	/*
	if params.MaxArtists > 25 {
		params.MaxArtists = 25
	}
	*/
	parts := []string{}
	seed := map[string]*spotify.Artist{}
	artists := []*spotify.Artist{}
	for _, artistName := range params.Seed {
		search, err := spot.SearchArtist(artistName)
		if err != nil {
			return nil, err
		}
		if len(search) == 0 {
			continue
		}
		parts = append(parts, artistName)
		sort.Slice(search, func(i, j int) bool {
			return search[i].Popularity > search[j].Popularity
		})
		seed[search[0].ID] = search[0]
	}
	user := getUser(r)
	var title string
	if len(parts) == 0 {
		return nil, H.NotFound
	} else if len(parts) == 1 {
		title = parts[0]
	} else {
		title = strings.Join(parts[:len(parts)-1], ", ") + " & " + parts[len(parts) - 1]
	}
	if len(seed) >= params.MaxArtists {
		for _, art := range seed {
			artists = append(artists, art)
		}
	} else {
		all := map[string]*spotify.Artist{}
		level1 := map[string]*spotify.Artist{}
		for _, artist := range seed {
			all[artist.ID] = artist
			rel, err := artist.GetRelated()
			if err != nil {
				return nil, err
			}
			for _, art := range rel {
				if _, ok := seed[art.ID]; !ok {
					level1[art.ID] = art
				}
			}
		}
		if len(seed) + len(level1) < params.MaxArtists {
			for _, artist := range level1 {
				all[artist.ID] = artist
				rel, err := artist.GetRelated()
				if err != nil {
					return nil, err
				}
				for _, art := range rel {
					all[art.ID] = art
				}
			}
		} else {
			for _, artist := range level1 {
				all[artist.ID] = artist
			}
		}
		/*
		if len(all) > params.MaxArtists {
			for id := range seed {
				delete(all, id)
			}
			ids := []string{}
			for id := range all {
				ids = append(ids, id)
			}
			rand.Shuffle(len(ids), func(i, j int) {
				ids[i], ids[j] = ids[j], ids[i]
			})
			for len(ids) > params.MaxArtists - len(seed) {
				delete(all, ids[len(ids) - 1])
				ids = ids[:len(ids) - 1]
			}
			for id, artist := range seed {
				all[id] = artist
			}
		}
		*/
		for id, artist := range seed {
			artists = append(artists, artist)
			delete(all, id)
		}
		for _, artist := range all {
			artists = append(artists, artist)
		}
		n := len(seed)
		rand.Shuffle(len(artists) - n, func(i, j int) {
			artists[i+n], artists[j+n] = artists[j+n], artists[i+n]
		})
	}
	tracks := []*musicdb.Track{}
	for _, artist := range artists {
		atracks, err := db.MixArtistTracks(artist.Name, &user.PersistentID, params.MinRating, params.MaxTracksPerArtist)
		if err != nil {
			return nil, err
		}
		if len(atracks) == 0 {
			continue
		}
		tracks = append(tracks, atracks...)
		params.MaxArtists -= 1
		if params.MaxArtists <= 0 {
			break
		}
	}
	rand.Shuffle(len(tracks), func(i, j int) {
		tracks[i], tracks[j] = tracks[j], tracks[i]
	})
	if len(tracks) > params.MaxTracks {
		tracks = tracks[:params.MaxTracks]
	}
	trackIds := make([]pid.PersistentID, len(tracks))
	for i, tr := range tracks {
		trackIds[i] = tr.PersistentID
	}
	playlist := &musicdb.Playlist{
		PersistentID: 0,
		OwnerID: 0,
		Shared: false,
		Kind: musicdb.MixPlaylist,
		Folder: false,
		Name: title,
		DateAdded: nil,
		DateModified: nil,
		Smart: nil,
		GeniusTrackID: nil,
		TrackIDs: trackIds,
		PlaylistItems: tracks,
		SortField: "",
	}
	cacheFor(w, time.Hour * 24)
	return playlist, nil
}
