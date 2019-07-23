package lastfm

import (
	"bufio"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/pkg/errors"
)

var lastFMRoot = url.URL{
	Scheme: "http",
	Host: "ws.audioscrobbler.com",
	Path: "/2.0/",
}

type LastFM struct {
	key string
	cacheRoot string
	client *http.Client
	lastFetch time.Time
	minGap time.Duration
	maxCacheTime time.Duration
}

func NewLastFM(apiKey, cacheRoot string, maxCacheTime time.Duration) *LastFM {
	return &LastFM{
		key: apiKey,
		cacheRoot: cacheRoot,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		lastFetch: time.Unix(0, 0),
		minGap: 225 * time.Millisecond,
		maxCacheTime: maxCacheTime,
	}
}

func (c *LastFM) cacheGet(url string) (*http.Response, error) {
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	data := []byte(url)
	sum := sha1.Sum(data)
	code := hex.EncodeToString(sum[:])
	dn := filepath.Join(c.cacheRoot, code[0:2], code[2:4])
	fn := filepath.Join(dn, code[4:])
	if st, err := os.Stat(fn); err == nil {
		if time.Now().Sub(st.ModTime()) < c.maxCacheTime {
			f, err := os.Open(fn)
			if f != nil {
				defer f.Close()
			}
			if err == nil {
				rd := bufio.NewReader(f)
				//log.Printf("using cached response from %s for %s\n", fn, url)
				res, err := http.ReadResponse(rd, req)
				return res, errors.Wrap(err, "can't read cached response from " + fn)
			}
		}
	}
	delta := time.Now().Sub(c.lastFetch)
	if delta < c.minGap {
		time.Sleep(c.minGap - delta)
	}
	res, err := c.client.Do(req)
	c.lastFetch = time.Now()
	if err != nil {
		return res, errors.Wrap(err, "can't execute lastfm request")
	}
	if _, err := os.Stat(dn); err != nil {
		if os.IsNotExist(err) {
			err = os.MkdirAll(dn, os.FileMode(0775))
			if err != nil {
				return res, errors.Wrap(err, "can't create cache directory for " + fn)
			}
		} else {
			return res, errors.Wrap(err, "can't stat cache directory " + dn)
		}
	}
	resdata, err := httputil.DumpResponse(res, true)
	if err != nil {
		return res, errors.Wrap(err, "can't serialize lastfm response")
	}
	err = ioutil.WriteFile(fn, resdata, os.FileMode(0644))
	if err != nil {
		return res, errors.Wrap(err, "can't write to cache file " + fn)
	}
	//log.Printf("cached %s to %s\n", url, fn)
	return res, nil
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
	//log.Println("GET", u.String())
	resp, err := c.cacheGet(u.String())
	if err != nil {
		return errors.Wrap(err, "can't get lastfm cached response")
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return errors.Wrap(err, "can't read lastfm response")
	}
	err = json.Unmarshal(body, obj)
	if err != nil {
		return errors.Wrapf(err, "can't unmarshal lastfm response into %T", obj)
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
		return nil, errors.Wrap(err, "can't get lastfm artist " + artist)
	}
	return obj.Artist, nil
}

func (c *LastFM) GetArtistImage(artist string) ([]byte, string, error) {
	art, err := c.GetArtistInfo(artist)
	if err != nil {
		return nil, "", errors.Wrap(err, "can't get lastfm artist info")
	}
	sized := map[string]string{}
	for _, img := range art.Image {
		sized[img.Size] = img.URL
	}
	sizes := []string{"mega", "extralarge", "large", "medium", "small", ""}
	for _, size := range sizes {
		url, ok := sized[size]
		if ok {
			resp, err := c.cacheGet(url)
			if err == nil {
				defer resp.Body.Close()
				body, err := ioutil.ReadAll(resp.Body)
				if err == nil {
					return body, resp.Header.Get("Content-Type"), nil
				} else {
					log.Printf("error reading %s: %s\n", url, err.Error())
				}
			} else {
				log.Printf("error fetching %s: %s\n", url, err.Error())
			}
		}
	}
	return nil, "", errors.Errorf("no useful images for artist %s", artist)
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
		return nil, errors.Wrap(err, "can't get lastfm similar artists for " + artist)
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
		return nil, errors.Wrapf(err, "can't get lastfm album info for %s / %s", artist, title)
	}
	if obj.Album == nil {
		return nil, errors.New("no album info available")
	}
	return obj.Album, nil
}

func (c *LastFM) GetAlbumImage(artist, title string) ([]byte, string, error) {
	alb, err := c.GetAlbumInfo(artist, title)
	if err != nil {
		return nil, "", errors.Wrap(err, "can't get album info")
	}
	if alb.Image == nil {
		return nil, "", errors.New("album info contained no images")
	}
	sized := map[string]string{}
	for _, img := range alb.Image {
		sized[img.Size] = img.URL
	}
	sizes := []string{"mega", "extralarge", "large", "medium", "small", ""}
	for _, size := range sizes {
		url, ok := sized[size]
		if ok && url != "" {
			resp, err := c.cacheGet(url)
			if err == nil {
				defer resp.Body.Close()
				body, err := ioutil.ReadAll(resp.Body)
				if err == nil {
					//log.Printf("got %s image (%s)\n", size, resp.Header.Get("Content-Type"))
					return body, resp.Header.Get("Content-Type"), nil
				} else {
					log.Printf("error reading %s: %s\n", url, err.Error())
				}
			} else {
				log.Printf("error fetching %s: %s\n", url, err.Error())
			}
		}
	}
	return nil, "", errors.Errorf("no useful images for album %s - %s", artist, title)
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
		return nil, errors.Wrapf(err, "can't get lastfm track info for %s / %s", artist, title)
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
		return nil, errors.Wrapf(err, "can't get lastfm similar tracks for %s / %s", artist, title)
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
		}{}
		err := c.Get("tag.getTopTags", args, &obj)
		if err != nil {
			return nil, errors.Wrap(err, "can't get lastfm top tags")
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
			return nil, errors.Wrap(err, "can't get lastfm top tracks for tag " + tag)
		}
		tracks = append(tracks, obj.Tracks.Tracks...)
		page += 1
		args["page"] = strconv.Itoa(page)
	}
	return tracks, nil
}

