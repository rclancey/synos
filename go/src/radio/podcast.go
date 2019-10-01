package radio

import (
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/mmcdole/gofeed"
)

type PodcastEpisode struct {
	*gofeed.Item
}

func (ep *PodcastEpisode) Duration() int {
	if ep.ITunesExt == nil {
		return -1
	}
	s, err := strconv.Atoi(ep.ITunesExt.Duration)
	if err != nil {
		return -1
	}
	return s * 1000
}

func (ep *PodcastEpisode) AudioURL() string {
	for _, enc := range ep.Enclosures {
		if enc.Type == "audio/mpeg" {
			return enc.URL
		}
	}
	return ""
}

func (ep *PodcastEpisode) Reader() (io.ReadCloser, error) {
	u := ep.AudioURL()
	if u == "" {
		return nil, errors.New("no url for episode")
	}
	cli := &http.Client{}
	res, err := cli.Get(u)
	if err != nil {
		return nil, err
	}
	if res.StatusCode != http.StatusOK {
		res.Body.Close()
		return nil, errors.New("http error " + res.Status)
	}
	if !strings.HasPrefix(res.Header.Get("Content-Type"), "audio/") {
		res.Body.Close()
		return nil, errors.New("not audio data")
	}
	return res.Body, nil
}

type Podcast struct {
	URL *url.URL
	feed *gofeed.Feed
	lastRefresh time.Time
	lastPlayed time.Time
	lastItem string
	updateFrequency time.Duration
	updateCount int
	avgUpdateFrequency time.Duration
}

func NewPodcast(u string) (*Podcast, error) {
	uObj, err := url.Parse(u)
	if err != nil {
		return nil, err
	}
	p := &Podcast{
		URL: uObj,
		feed: nil,
		lastRefresh: time.Now().Add(-24 * time.Hour),
		lastPlayed: time.Now().Add(-24 * time.Hour),
		lastItem: "",
		updateFrequency: time.Hour,
		updateCount: 0,
		avgUpdateFrequency: 0,
	}
	err = p.Refresh()
	if err != nil {
		return nil, err
	}
	return p, nil
}

func feedUpdateTime(t time.Time, f *gofeed.Feed) time.Time {
	var ut time.Time
	if f.Items != nil {
		for _, item := range f.Items {
			if item.UpdatedParsed != nil && item.UpdatedParsed.After(ut) {
				ut = *item.UpdatedParsed
			}
			if item.PublishedParsed != nil && item.PublishedParsed.After(ut) {
				ut = *item.PublishedParsed
			}
		}
	}
	if f.UpdatedParsed != nil && (ut.IsZero() || f.UpdatedParsed.Before(ut)) {
		ut = *f.UpdatedParsed
	}
	if ut.IsZero() {
		return t
	}
	return ut
}

func (p *Podcast) Refresh() error {
	if p.lastRefresh.Add(p.updateFrequency).After(time.Now()) {
		return nil
	}
	parser := gofeed.NewParser()
	feed, err := parser.ParseURL(p.URL.String())
	if err != nil {
		return err
	}
	if p.feed != nil {
		t1 := feedUpdateTime(p.lastRefresh, p.feed)
		t2 := feedUpdateTime(time.Now(), feed)
		if t2.After(t1) {
			dur := t2.Sub(t1)
			if dur > 24 * time.Hour {
				dur = 24 * time.Hour
			} else if dur < time.Hour {
				dur = time.Hour
			}
			avg := int64(p.avgUpdateFrequency) * int64(p.updateCount) + int64(dur)
			avg /= int64(p.updateCount + 1)
			adur := time.Duration(avg)
			if adur > 24 * time.Hour {
				adur = 24 * time.Hour
			} else if adur < 2 * time.Hour {
				adur = time.Hour
			} else {
				adur = time.Hour * ((adur + 10 * time.Minute) / time.Hour)
			}
			p.avgUpdateFrequency = adur
			if p.updateCount < 5 {
				p.updateCount += 1
			} else {
				p.updateFrequency = p.avgUpdateFrequency
			}
			p.lastRefresh = t2
			p.feed = feed
		}
	} else {
		p.lastRefresh = feedUpdateTime(time.Now(), feed)
		p.updateCount = 0
		p.feed = feed
	}
	return nil
}

func (p *Podcast) Latest() *PodcastEpisode {
	p.Refresh()
	if p.feed == nil || p.feed.Items == nil || len(p.feed.Items) == 0 {
		return nil
	}
	newest := p.feed.Items[0]
	if newest == nil {
		return nil
	}
	if newest.GUID == p.lastItem {
		return nil
	}
	if newest.PublishedParsed != nil {
		if !newest.PublishedParsed.After(p.lastPlayed) {
			return nil
		}
	}
	return &PodcastEpisode{newest}
}

func (p *Podcast) MarkListened(ep *PodcastEpisode) {
	if ep.UpdatedParsed != nil {
		p.lastPlayed = *ep.UpdatedParsed
	} else if ep.PublishedParsed != nil {
		p.lastPlayed = *ep.PublishedParsed
	} else {
		p.lastPlayed = time.Now()
	}
	p.lastItem = ep.GUID
}
