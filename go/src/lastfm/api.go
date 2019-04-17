package lastfm

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
)

var lastFMRoot = url.URL{
	Scheme: "http",
	Host: "ws.audioscrobbler.com",
	Path: "/2.0/",
}

type LastFM struct {
	key string
}

func NewLastFM(apiKey string) *LastFM {
	return &LastFM{
		key: apiKey,
	}
}

func (c *LastFM) Get(method string, args map[string]string, obj interface{}) error {
	vals := url.Values{}
	for k, v := range args {
		vals.Set(k, v)
	}
	vals.Set("method", method)
	vals.Set("format", "json")
	vals.Set("api_key", c.key)
	u := url.URL{
		Scheme: lastFMRoot.Scheme,
		Host: lastFMRoot.Host,
		Path: lastFMRoot.Path,
		RawQuery: vals.Encode(),
	}
	fmt.Println("GET", u.String())
	resp, err := http.Get(u.String())
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	fmt.Println(string(body))
	err = json.Unmarshal(body, obj)
	if err != nil {
		return err
	}
	return nil
}

func (c *LastFM) GetArtistInfo(artist string) (*Artist, error) {
	obj := struct {
		Artist *Artist `json:"artist"`
	}{}
	args := map[string]string{
		"artist": artist,
	}
	err := c.Get("artist.getInfo", args, &obj)
	if err != nil {
		return nil, err
	}
	return obj.Artist, nil
}

func (c *LastFM) GetSimilarArtists(artist string) ([]*Artist, error) {
	obj := struct {
		SimilarArtists struct {
			Artists []*Artist `json:"artist"`
		} `json:"similarartists"`
	}{}
	args := map[string]string{
		"artist": artist,
	}
	err := c.Get("artist.getSimilar", args, &obj)
	if err != nil {
		return nil, err
	}
	return obj.SimilarArtists.Artists, nil
}

func (c *LastFM) GetAlbumInfo(artist, title string) (*Album, error) {
	obj := struct {
		Album *Album `json:"album"`
	}{}
	args := map[string]string{
		"artist": artist,
		"album": title,
	}
	err := c.Get("album.getInfo", args, &obj)
	if err != nil {
		return nil, err
	}
	return obj.Album, nil
}

func (c *LastFM) GetTrackInfo(artist, title string) (*Track, error) {
	obj := struct {
		Track *Track `json:"track"`
	}{}
	args := map[string]string{
		"artist": artist,
		"track": title,
	}
	err := c.Get("track.getInfo", args, &obj)
	if err != nil {
		return nil, err
	}
	return obj.Track, nil
}

func (c *LastFM) GetSimilarTracks(artist, title string) ([]*Track, error) {
	obj := struct {
		SimilarTracks struct {
			Tracks []*Track `json:"track"`
		} `json:"similartracks"`
	}{}
	args := map[string]string{
		"artist": artist,
		"track": title,
	}
	err := c.Get("track.getSimilar", args, &obj)
	if err != nil {
		return nil, err
	}
	return obj.SimilarTracks.Tracks, nil
}

func (c *LastFM) GetTopTags(n int) ([]*Tag, error) {
	if n <= 0 {
		n = 1
	}
	tags := make([]*Tag, 0, n)
	args := map[string]string{}
	for len(tags) < n {
		obj := struct {
			TopTags struct {
				Tags []*Tag `json:"tag"`
			} `json:"toptags"`
		}
		err := c.Get("tag.getTopTags", args, &obj)
		if err != nil {
			return nil, err
		}
		tags = append(tags, obj.TopTags.Tags...)
		args["offset"] = strconv.Itoa(len(tags))
	}
	return tags, nil
}

func (c *LastFM) GetTagTracks(tag string, n int) ([]*Track, error) {
	if n <= 0 {
		n = 1
	}
	tracks := make([]*Track, 0, n)
	args := map[string]string{
		"tag": tag,
	}
	var page int = 1
	for len(tracks) < n {
		obj := struct {
			Tracks struct {
				Tracks []*Track `json:"track"`
			} `json:"tracks"`
		}{}
		err := c.Get("tag.getTopTracks", args, &obj)
		if err != nil {
			return nil, err
		}
		tracks = append(tracks, obj.Tracks.Tracks...)
		page += 1
		args["page"] = strconv.Itoa(page)
	}
	return tracks, nil
}

