package api

import (
	"net/http"
	"strings"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/itunes/persistentId"
	"github.com/rclancey/spotify"
	"github.com/rclancey/synos/musicdb"
)

func GeniusAPI(router H.Router, authmw H.Middleware) {
	router.GET("/tracks", authmw(H.HandlerFunc(MakeGeniusPlaylist)))
	router.GET("/genres", authmw(H.HandlerFunc(GeniusMixGenres)))
	router.POST("/mix/:genre", authmw(H.HandlerFunc(MakeGeniusMix)))
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
	return playlist, nil
}
