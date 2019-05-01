package sonos

import (
	"encoding/json"
	"encoding/xml"
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
	"github.com/ianr0bkny/go-sonos/didl"
	"github.com/ianr0bkny/go-sonos/ssdp"
	"github.com/ianr0bkny/go-sonos/upnp"

	"itunes"
)

var refTime = time.Date(0, time.January, 1, 0, 0, 0, 0, time.UTC)

type Sonos struct {
	player *sonos.Sonos
	reactor upnp.Reactor
	rootUrl *url.URL
	lib *itunes.Library
	Events chan interface{}
}

func NewSonos(iface string, rootUrl *url.URL, lib *itunes.Library) (*Sonos, error) {
	mgr := ssdp.MakeManager()
	mgr.Discover(iface, "11209", false)
	qry := ssdp.ServiceQueryTerms{
		ssdp.ServiceKey("schemas-upnp-org-MusicServices"): -1,
	}
	result := mgr.QueryServices(qry)
	s := &Sonos{
		rootUrl: rootUrl,
		lib: lib,
		Events: make(chan interface{}, 1024),
	}
	if dev_list, has := result["schemas-upnp-org-MusicServices"]; has {
		for _, dev := range dev_list {
			if dev.Product() == "Sonos" {
				s.reactor = sonos.MakeReactor(iface, "11210")
				go func() {
					c := s.reactor.Channel()
					for {
						ev := <-c
						evt, err := s.prettyEvent(ev)
						if err == nil {
							s.Events <- evt
						}
					}
				}()
				s.player = sonos.Connect(dev, s.reactor, sonos.SVC_CONNECTION_MANAGER|sonos.SVC_CONTENT_DIRECTORY|sonos.SVC_RENDERING_CONTROL|sonos.SVC_AV_TRANSPORT)
				return s, nil
			}
		}
	}
	return nil, errors.New("No Sonos device found on network")
}

type Queue struct {
	Tracks []*itunes.Track `json:"tracks,omitempty"`
	Index int `json:"index"`
	Duration int `json:"duration"`
	Time int `json:"time"`
	State string `json:"state"`
	Speed float64 `json:"speed"`
	Volume int `json:"volume"`
}

func parseTime(timestr string, layouts ...string) (int, error) {
	var err error
	var t time.Time
	for _, l := range layouts {
		t, err = time.Parse(l, timestr)
		if err == nil {
			ns := t.Sub(refTime).Nanoseconds()
			log.Println(timestr, "=", ns)
			return int(t.Sub(refTime).Nanoseconds() / 1000000), nil
		}
	}
	return -1, err
}

func (s *Sonos) GetPlaybackStatus() (*Queue, error) {
	info, err := s.player.GetTransportInfo(0)
	if err != nil {
		return nil, err
	}
	q := &Queue{
		State: info.CurrentTransportState,
	}
	if strings.Contains(info.CurrentSpeed, "/") {
		parts := strings.SplitN(info.CurrentSpeed, "/", 2)
		num, err := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
		if err != nil {
			return nil, err
		}
		den, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
		if err != nil {
			return nil, err
		}
		if den != 0 {
			q.Speed = num / den
		} else {
			q.Speed = 0
		}
	} else {
		s, err := strconv.ParseFloat(strings.TrimSpace(info.CurrentSpeed), 64)
		if err != nil {
			return nil, err
		}
		q.Speed = s
	}
	return q, nil
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
	q, err := s.GetPlaybackStatus()
	if err != nil {
		return nil, err
	}
	q.Tracks = tracks
	pos, err := s.GetQueuePos()
	if err != nil {
		return nil, err
	}
	q.Index = pos.Index
	q.Duration = pos.Duration
	q.Time = pos.Time
	vol, err := s.GetVolume()
	if err != nil {
		return nil, err
	}
	q.Volume = vol
	return q, nil
}

func (s *Sonos) trackUri(track *itunes.Track) string {
	ext := filepath.Ext(track.Path())
	path := "/api/track/" + *track.PersistentID + ext
	u, _ := url.Parse(path)
	ref := s.rootUrl.ResolveReference(u)
	return ref.String()
}

func (s *Sonos) playlistUri(pl *itunes.Playlist) string {
	path := "/api/playlist/" + *pl.PlaylistPersistentID + ".m3u"
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

func (s *Sonos) didlLitePl(pl *itunes.Playlist) string {
	if pl.PlaylistPersistentID == nil {
		return ""
	}
	plId := *pl.PlaylistPersistentID
	//mediaUri := s.playlistUri(pl)
	var name string
	if pl.Name != nil {
		name = *pl.Name
	}
	return fmt.Sprintf(`<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
	<item id="playlists:%s" parentID="playlists:%s" restricted="true">
		<dc:title>Playlists</dc:title>
		<upnp:class>object.container</upnp:class>
		<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">%s</desc>
	</item>
</DIDL-Lite>`, plId, plId, name)
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

func (s *Sonos) ReplaceQueueWithPlaylist(pl *itunes.Playlist) error {
	err := s.ClearQueue()
	if err != nil {
		return err
	}
	return s.AppendPlaylistToQueue(pl)
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

func (s *Sonos) AppendPlaylistToQueue(pl *itunes.Playlist) error {
	uri := s.playlistUri(pl)
	req := &upnp.AddURIToQueueIn{
		EnqueuedURI: uri,
		EnqueuedURIMetaData: s.didlLitePl(pl),
	}
	_, err := s.player.AddURIToQueue(0, req)
	if err != nil {
		return err
	}
	return nil
}

func (s *Sonos) InsertIntoQueue(tracks []*itunes.Track, pos int) error {
	for i, track := range tracks {
		uri := s.trackUri(track)
		req := &upnp.AddURIToQueueIn{
			EnqueuedURI: uri,
			EnqueuedURIMetaData: s.didlLite(track),
			DesiredFirstTrackNumberEnqueued: uint32(pos + i + 1),
		}
		_, err := s.player.AddURIToQueue(0, req)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Sonos) InsertPlaylistIntoQueue(pl *itunes.Playlist, pos int) error {
	uri := s.playlistUri(pl)
	req := &upnp.AddURIToQueueIn{
		EnqueuedURI: uri,
		EnqueuedURIMetaData: s.didlLitePl(pl),
		DesiredFirstTrackNumberEnqueued: uint32(pos + 1),
	}
	_, err := s.player.AddURIToQueue(0, req)
	if err != nil {
		return err
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
	return s.player.Seek(0, "TRACK_NR", strconv.Itoa(pos + 1))
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
	return s.SetQueuePosition(q.Index + n)
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

func (s *Sonos) GetVolume() (int, error) {
	vol, err := s.player.GetVolume(0, "Master")
	if err != nil {
		return -1, err
	}
	return int(vol), nil
}

func (s *Sonos) SetVolume(vol int) error {
	if vol > 100 {
		vol = 100
	} else if vol < 0 {
		vol = 0
	}
	return s.player.SetVolume(0, "Master", uint16(vol))
}

func (s *Sonos) AlterVolume(delta int) error {
	vol, err := s.GetVolume()
	if err != nil {
		return err
	}
	return s.SetVolume(vol + delta)
}

/*
func (s *Sonos) Events() chan interface{} {
	return s.reactor.Channel()
}
*/

func parseDidl(data string) ([]*itunes.Track, error) {
	//log.Println("parseDidl", data)
	doc := &didl.Lite{}
	xml.Unmarshal([]byte(data), doc)
	tracks := make([]*itunes.Track, len(doc.Item))
	for i, item := range doc.Item {
		var title, artist, id string
		var dur int
		if len(item.Title) > 0 {
			title = item.Title[0].Value
		}
		if len(item.Creator) > 0 {
			artist = item.Creator[0].Value
		}
		id = item.ID
		if len(item.Res) > 0 {
			/*
			uri, err := url.Parse(item.Res[0].Value)
			if err == nil {
				fn := path.Base(uri.Path)
				ext := path.Ext(fn)
				if ext != "" {
					id = strings.TrimSuffix(ext)
				} else {
					id = fn
				}
			}
			*/
			durT, err := time.Parse("15:04:05", item.Res[0].Duration)
			if err == nil {
				durD := durT.Sub(refTime)
				dur = int(durD.Seconds() * 1000.0)
			}
		}
		tracks[i] = &itunes.Track{
			PersistentID: &id,
			Name: &title,
			Artist: &artist,
			TotalTime: &dur,
		}
	}
	return tracks, nil
}

type JSONURL url.URL

func (u *JSONURL) MarshalJSON() ([]byte, error) {
	nu := url.URL(*u)
	return json.Marshal(nu.String())
}

func ParseJSONURL(val string) (*JSONURL, error) {
	u, err := url.Parse(val)
	if err != nil {
		return nil, err
	}
	ju := JSONURL(*u)
	return &ju, nil
}

type AVTransportEvent struct {
	TransportState string `json:"state"`
	CurrentPlayMode string `json:"mode"`
	CurrentCrossfadeMode int `json:"crossfade_mode"`
	QueueLength int `json:"queue_length"`
	QueuePosition int `json:"queue_position"`
	CurrentSection int `json:"section,omitempty"`
	CurrentTrackURI *JSONURL `json:"current_track_uri,omitempty"`
	CurrentTrack *itunes.Track `json:"current_track,omitempty"`
	NextTrackURI *JSONURL `json:"next_track_uri,omitempty"`
	NextTrack *itunes.Track `json:"next_track,omitempty"`
	EnqueuedTrackURI *JSONURL `json:"enqueued_track_uri,omitempty"`
	EnqueuedTrack *itunes.Track `json:"enqueued_track,omitempty"`
	Queue *Queue `json:"queue,omitempty"`
}

type RenderingControlEvent struct {
	Volume int `json:"volume"`
	Mute bool `json:"mute"`
	Bass int `json:"bass"`
	Treble int `json:"treble"`
	Loudness int `json:"loudness"`
}

func (s *Sonos) prettyEvent(event upnp.Event) (interface{}, error) {
	switch evt := event.(type) {
		case upnp.AVTransportEvent:
			change := evt.LastChange.InstanceID
			//data, _ := json.MarshalIndent(change, "", "  ")
			//log.Println("change =", string(data))
			pretty := &AVTransportEvent{
				TransportState: change.TransportState.Val,
				CurrentPlayMode: change.CurrentPlayMode.Val,
			}
			pretty.CurrentCrossfadeMode, _ = strconv.Atoi(change.CurrentCrossfadeMode.Val)
			pretty.QueueLength, _ = strconv.Atoi(change.NumberOfTracks.Val)
			pretty.QueuePosition, _ = strconv.Atoi(change.CurrentTrack.Val)
			pretty.QueuePosition--
			pretty.CurrentTrackURI, _ = ParseJSONURL(change.CurrentTrackURI.Val)
			tracks, err := parseDidl(change.CurrentTrackMetaData.Val)
			var ok bool
			if err == nil && len(tracks) == 1 {
				if tracks[0].TotalTime == nil || *tracks[0].TotalTime == 0 {
					durT, err := time.Parse("15:04:05", change.CurrentTrackDuration.Val)
					if err == nil {
						durD := durT.Sub(refTime)
						dur := int(durD.Seconds() * 1000.0)
						tracks[0].TotalTime = &dur
					}
				}
				if tracks[0].PersistentID != nil {
					pretty.CurrentTrack, ok = s.lib.Tracks[*tracks[0].PersistentID]
					if !ok {
						pretty.CurrentTrack = tracks[0]
					}
				} else {
					pretty.CurrentTrack = tracks[0]
				}
			}
			pretty.NextTrackURI, _ = ParseJSONURL(change.NextTrackURI.Val)
			tracks, err = parseDidl(change.CurrentTrackMetaData.Val)
			if err == nil && len(tracks) > 0 {
				if tracks[0].PersistentID != nil {
					pretty.NextTrack, ok = s.lib.Tracks[*tracks[0].PersistentID]
					if !ok {
						pretty.NextTrack = tracks[0]
					}
				} else {
					pretty.NextTrack = tracks[0]
				}
			}
			pretty.EnqueuedTrackURI, _ = ParseJSONURL(change.EnqueuedTransportURI.Val)
			tracks, err = parseDidl(change.EnqueuedTransportURIMetaData.Val)
			if err == nil && len(tracks) > 0 {
				if tracks[0].PersistentID != nil {
					pretty.EnqueuedTrack, ok = s.lib.Tracks[*tracks[0].PersistentID]
					if !ok {
						pretty.EnqueuedTrack = tracks[0]
					}
				} else {
					pretty.EnqueuedTrack = tracks[0]
				}
			}
			if s.player != nil && pretty.TransportState == "TRANSITIONING" {
				pretty.Queue, _ = s.GetQueuePos()
			}
			return pretty, nil
		case upnp.RenderingControlEvent:
			change := evt.LastChange.InstanceID
			pretty := &RenderingControlEvent{}
			for _, vol := range change.Volume {
				if vol.Channel == "Master" || vol.Channel == "" {
					pretty.Volume, _ = strconv.Atoi(vol.Val)
				}
			}
			for _, vol := range change.Mute {
				if vol.Channel == "Master" || vol.Channel == "" {
					mute, _ := strconv.Atoi(vol.Val)
					pretty.Mute = mute > 0
				}
			}
			for _, vol := range change.Bass {
				if vol.Channel == "Master" || vol.Channel == "" {
					pretty.Bass, _ = strconv.Atoi(vol.Val)
				}
			}
			for _, vol := range change.Treble {
				if vol.Channel == "Master" || vol.Channel == "" {
					pretty.Treble, _ = strconv.Atoi(vol.Val)
				}
			}
			for _, vol := range change.Loudness {
				if vol.Channel == "Master" || vol.Channel == "" {
					pretty.Loudness, _ = strconv.Atoi(vol.Val)
				}
			}
			return pretty, nil
		case upnp.ContentDirectoryEvent:
			/*
			//change := evt.LastChange.InstanceID
			data, _ := json.MarshalIndent(evt, "", "  ")
			log.Println("event =", string(data))
			*/
			if s.player != nil {
				q, _ := s.GetQueue()
				return q, nil
			}
			return evt, nil
		default:
			return evt, nil
	}
	return nil, nil
}
