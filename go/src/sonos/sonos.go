package sonos

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/ianr0bkny/go-sonos"
	"github.com/ianr0bkny/go-sonos/ssdp"
	"github.com/ianr0bkny/go-sonos/upnp"

	"itunes"
)

type Sonos struct {
	player *sonos.Sonos
	rootUrl *url.URL
	lib *itunes.Library
}

func NewSonos(iface string, rootUrl *url.URL, lib *itunes.Library) (*Sonos, error) {
	mgr := ssdp.MakeManager()
	mgr.Discover(iface, "11209", false)
	qry := ssdp.ServiceQueryTerms{
		ssdp.ServiceKey("schemas-upnp-org-MusicServices"): -1,
	}
	var player *sonos.Sonos
	result := mgr.QueryServices(qry)
	if dev_list, has := result["schemas-upnp-org-MusicServices"]; has {
		for _, dev := range dev_list {
			if dev.Product() == "Sonos" {
				player = sonos.Connect(dev, nil, sonos.SVC_CONNECTION_MANAGER|sonos.SVC_CONTENT_DIRECTORY|sonos.SVC_RENDERING_CONTROL|sonos.SVC_AV_TRANSPORT)
				break
			}
		}
	}
	if player == nil {
		return nil, errors.New("No Sonos device found on network")
	}
	return &Sonos{player: player, rootUrl: rootUrl, lib: lib}, nil
}

type Queue struct {
	Tracks []*itunes.Track `json:"tracks,omitempty"`
	Index int `json:"index"`
	Duration int `json:"duration"`
	Time int `json:"time"`
}

func parseTime(timestr string, layouts ...string) (int, error) {
	ref := time.Date(0, time.January, 1, 0, 0, 0, 0, time.UTC)
	var err error
	var t time.Time
	for _, l := range layouts {
		t, err = time.Parse(l, timestr)
		if err == nil {
			ns := t.Sub(ref).Nanoseconds()
			log.Println(timestr, "=", ns)
			return int(t.Sub(ref).Nanoseconds() / 1000000), nil
		}
	}
	return -1, err
}

func (s *Sonos) GetQueuePos() (*Queue, error) {
	pos, err := s.player.GetPositionInfo(0)
	if err != nil {
		return nil, err
	}
	q := &Queue{
		Index: int(pos.Track) - 1,
	}
	durT, err := parseTime(pos.TrackDuration, "15:04:05", "4:05")
	if err != nil {
		q.Duration = -1
	} else {
		q.Duration = durT
	}
	curT, err := parseTime(pos.RelTime, "15:04:05", "4:05")
	if err != nil {
		q.Time = -1
	} else {
		q.Time = curT
	}
	return q, nil
}

func (s *Sonos) GetQueue() (*Queue, error) {
	objs, err := s.player.GetQueueContents()
	tracks := make([]*itunes.Track, len(objs))
	for i, item := range objs {
		res := item.Res()
		uri, err := url.Parse(res)
		if err != nil {
			continue
		}
		_, fn := path.Split(uri.Path)
		id := strings.Split(fn, ".")[0]
		tr, ok := s.lib.Tracks[id]
		if ok {
			tracks[i] = tr
		} else {
			tracks[i] = &itunes.Track{Location: &res}
		}
	}
	q, err := s.GetQueuePos()
	if err != nil {
		return nil, err
	}
	q.Tracks = tracks
	return q, nil
}

func (s *Sonos) trackUri(track *itunes.Track) string {
	ext := filepath.Ext(track.Path())
	path := "/api/track/" + *track.PersistentID + ext
	u, _ := url.Parse(path)
	ref := s.rootUrl.ResolveReference(u)
	return ref.String()
}

func (s *Sonos) coverUri(track *itunes.Track) string {
	ext := ".jpg"
	path := "/api/cover/" + *track.PersistentID + ext
	u, _ := url.Parse(path)
	ref := s.rootUrl.ResolveReference(u)
	return ref.String()
}

func (s *Sonos) didlLite(track *itunes.Track) string {
	if track.PersistentID == nil {
		return ""
	}
	trackId := *track.PersistentID
	mediaUri := s.trackUri(track)
	duration := "0:00"
	if track.TotalTime != nil {
		hours := *track.TotalTime / 3600000
		mins := (*track.TotalTime % 3600000) / 60000
		secs := (*track.TotalTime % 60000) / 1000
		duration = fmt.Sprintf("%d:%02d:%02d", hours, mins, secs)
		log.Println("total time", *track.TotalTime, "=", duration)
	}
	coverUri := s.coverUri(track)
	title, _ := track.GetName()
	artist, _ := track.GetArtist()
	album, _ := track.GetAlbum()
	return fmt.Sprintf(`<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="%s" parentID="%s">
    <upnp:class>object.item.audioItem.musicTrack</upnp:class>
    <res protocolInfo="http-get:*:audio/mpeg:*" duration="%s">%s</res>
    <upnp:albumArtURI>%s</upnp:albumArtURI>
    <dc:title>%s</dc:title>
    <dc:creator>%s</dc:creator>
    <upnp:album>%s</upnp:album>
  </item>
</DIDL-Lite>`, trackId, trackId, duration, mediaUri, coverUri, title, artist, album)
}

func (s *Sonos) ClearQueue() error {
	err := s.player.Stop(0)
	if err != nil {
		return err
	}
	err = s.player.RemoveAllTracksFromQueue(0)
	if err != nil {
		return err
	}
	return nil
}

func (s *Sonos) ReplaceQueue(tracks []*itunes.Track) error {
	err := s.ClearQueue()
	if err != nil {
		return err
	}
	return s.AppendToQueue(tracks)
}

func (s *Sonos) AppendToQueue(tracks []*itunes.Track) error {
	for _, track := range tracks {
		uri := s.trackUri(track)
		req := &upnp.AddURIToQueueIn{
			EnqueuedURI: uri,
			EnqueuedURIMetaData: s.didlLite(track),
		}
		_, err := s.player.AddURIToQueue(0, req)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Sonos) InsertIntoQueue(tracks []*itunes.Track, pos int) error {
	for i, track := range tracks {
		uri := s.trackUri(track)
		req := &upnp.AddURIToQueueIn{
			EnqueuedURI: uri,
			EnqueuedURIMetaData: s.didlLite(track),
			DesiredFirstTrackNumberEnqueued: uint32(pos + i),
		}
		_, err := s.player.AddURIToQueue(0, req)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Sonos) Play() error {
	return s.player.Play(0, "1")
}

func (s *Sonos) Pause() error {
	return s.player.Pause(0)
}

func (s *Sonos) SetQueuePosition(pos int) error {
	return s.player.Seek(0, "TRACK_NR", strconv.Itoa(pos))
}

func (s *Sonos) SeekTo(ms int) error {
	hr := ms / 3600000
	min := (ms % 3600000) / 60000
	sec := (ms % 60000) / 1000
	ts := fmt.Sprintf("%d:%02d:%02d", hr, min, sec)
	return s.player.Seek(0, "REL_TIME", ts)
}

func (s *Sonos) SkipForward() error {
	return s.Skip(1)
}

func (s *Sonos) SkipBackward() error {
	return s.Skip(-1)
}

func (s *Sonos) Skip(n int) error {
	q, err := s.GetQueuePos()
	if err != nil {
		return err
	}
	return s.SetQueuePosition(q.Index + n + 1)
}

func (s *Sonos) Seek(ms int) error {
	q, err := s.GetQueuePos()
	if err != nil {
		return err
	}
	t := q.Time + ms
	if t >= q.Duration {
		return s.Skip(1)
	}
	if t < 0 {
		t = 0
	}
	return s.SeekTo(t)
}

