package sonos

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"log"
	"net/url"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/rclancey/go-sonos"
	"github.com/rclancey/go-sonos/didl"
	"github.com/rclancey/go-sonos/model"
	"github.com/rclancey/go-sonos/ssdp"
	"github.com/rclancey/go-sonos/upnp"
	"github.com/pkg/errors"

	"github.com/rclancey/synos/musicdb"
)

const (
	PlayModeShuffle = 1
	PlayModeRepeat = 2
)

var refTime = time.Date(0, time.January, 1, 0, 0, 0, 0, time.UTC)

type Sonos struct {
	iface string
	mgrPort int
	reactorPort int
	dev ssdp.Device
	player *sonos.Sonos
	reactor upnp.Reactor
	rootUrl *url.URL
	db *musicdb.DB
	closed bool
	Events chan interface{}
}

func NewSonos(iface string, rootUrl *url.URL, db *musicdb.DB) (*Sonos, error) {
	mgrPort, reactorPort, err := findFreePortPair(11209, 11299)
	if err != nil {
		return nil, err
	}
	s := &Sonos{
		iface: iface,
		mgrPort: mgrPort,
		reactorPort: reactorPort,
		rootUrl: rootUrl,
		db: db,
		closed: false,
		Events: make(chan interface{}, 1024),
	}
	dev, err := s.getSonosDevice()
	if err != nil {
		return nil, err
	}
	s.reactor = sonos.MakeReactor(iface, strconv.Itoa(reactorPort))
	go func() {
		c := s.reactor.Channel()
		for {
			ev := <-c
			evt, err := s.prettyEvent(ev)
			if err == nil {
				log.Println("sending event to listeners")
				s.Events <- evt
			} else {
				log.Println("error prettying event:", ev, err)
			}
		}
	}()
	s.dev = dev
	s.player = sonos.Connect(dev, s.reactor, sonos.SVC_CONNECTION_MANAGER|sonos.SVC_CONTENT_DIRECTORY|sonos.SVC_RENDERING_CONTROL|sonos.SVC_AV_TRANSPORT)
	s.PrepareQueue()
	return s, nil
}

func (s *Sonos) getSonosDevice() (ssdp.Device, error) {
	mgr := ssdp.MakeManager()
	defer mgr.Close()
	mgr.Discover(s.iface, strconv.Itoa(s.mgrPort), false)
	qry := ssdp.ServiceQueryTerms{
		ssdp.ServiceKey("schemas-upnp-org-MusicServices"): -1,
	}
	result := mgr.QueryServices(qry)
	if dev_list, has := result["schemas-upnp-org-MusicServices"]; has {
		for _, dev := range dev_list {
			if dev.Product() == "Sonos" {
				return dev, nil
			}
		}
	}
	return nil, errors.New("No Sonos device found on network")
}

type Queue struct {
	Tracks []*musicdb.Track `json:"tracks,omitempty"`
	Index int `json:"index"`
	Duration int `json:"duration"`
	Time int `json:"time"`
	State string `json:"state"`
	Speed float64 `json:"speed"`
	Volume int `json:"volume"`
	PlayMode int `json:"mode"`
}

func parseTime(timestr string, layouts ...string) (int, error) {
	var err error
	var t time.Time
	for _, l := range layouts {
		t, err = time.Parse(l, timestr)
		if err == nil {
			return int(t.Sub(refTime).Nanoseconds() / 1000000), nil
		}
	}
	return -1, errors.Wrap(err, "can't parse time " + timestr)
}

func (s *Sonos) Reconnect() (xerr error) {
	xerr = nil
	defer func() {
		if r := recover(); r != nil {
			rs, isa := r.(string)
			if isa {
				xerr = errors.New(rs)
			} else {
				xerr = errors.New("error communicating with sonos")
			}
		}
	}()
	dev, err := s.getSonosDevice()
	if err != nil {
		return err
	}
	s.dev = dev
	s.player = sonos.Connect(s.dev, s.reactor, sonos.SVC_CONNECTION_MANAGER|sonos.SVC_CONTENT_DIRECTORY|sonos.SVC_RENDERING_CONTROL|sonos.SVC_AV_TRANSPORT)
	s.PrepareQueue()
	return
}

func (s *Sonos) Closed() bool {
	return s.closed
}

func (s *Sonos) GetPlaybackStatus() (*Queue, error) {
	info, err := s.player.GetTransportInfo(0)
	if err != nil {
		return nil, errors.Wrap(err, "can't get player transport info")
	}
	q := &Queue{
		State: info.CurrentTransportState,
	}
	if strings.Contains(info.CurrentSpeed, "/") {
		parts := strings.SplitN(info.CurrentSpeed, "/", 2)
		num, err := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
		if err != nil {
			return nil, errors.Wrap(err, "can't parse floating point numerator value " + parts[0])
		}
		den, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
		if err != nil {
			return nil, errors.Wrap(err, "can't parse floating point denominator value " + parts[1])
		}
		if den != 0 {
			q.Speed = num / den
		} else {
			q.Speed = 0
		}
	} else {
		s, err := strconv.ParseFloat(strings.TrimSpace(info.CurrentSpeed), 64)
		if err != nil {
			return nil, errors.Wrap(err, "can't parse floating point current speed value " + info.CurrentSpeed)
		}
		q.Speed = s
	}
	return q, nil
}

func (s *Sonos) GetPlayMode() (int, error) {
	ts, err := s.player.GetTransportSettings(0)
	if err != nil {
		return 0, err
	}
	switch ts.PlayMode {
	case upnp.PlayMode_NORMAL:
		return 0, nil
	case upnp.PlayMode_REPEAT_ALL:
		return PlayModeRepeat, nil
	case upnp.PlayMode_SHUFFLE_NOREPEAT:
		return PlayModeShuffle, nil
	case upnp.PlayMode_SHUFFLE:
		return PlayModeShuffle | PlayModeRepeat, nil
	}
	return 0, nil
}

func (s *Sonos) SetPlayMode(mode int) error {
	var pm string
	switch mode {
	case 0:
		pm = upnp.PlayMode_NORMAL
	case PlayModeShuffle:
		pm = upnp.PlayMode_SHUFFLE_NOREPEAT
	case PlayModeRepeat:
		pm = upnp.PlayMode_REPEAT_ALL
	case PlayModeShuffle | PlayModeRepeat:
		pm = upnp.PlayMode_SHUFFLE
	default:
		return fmt.Errorf("unknown play mode: %d", mode)
	}
	return s.player.SetPlayMode(0, pm)
}

func (s *Sonos) GetQueuePos() (*Queue, error) {
	pos, err := s.player.GetPositionInfo(0)
	if err != nil {
		return nil, errors.Wrap(err, "can't get player current posistion")
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

func (s *Sonos) GetQueue() (queue *Queue, xerr error) {
	queue = nil
	xerr = nil
	defer func() {
		if r := recover(); r != nil {
			rs, isa := r.(string)
			if isa {
				xerr = errors.New(rs)
			} else {
				xerr = errors.New("panic communicating with sonos")
			}
		}
	}()
	objs, err := s.player.GetQueueContents()
	tracks := make([]*musicdb.Track, len(objs))
	for i, item := range objs {
		res := item.Res()
		uri, err := url.Parse(res)
		if err != nil {
			continue
		}
		_, fn := path.Split(uri.Path)
		id := new(musicdb.PersistentID)
		id.Decode(strings.Split(fn, ".")[0])
		tr, _ := s.db.GetTrack(*id)
		if tr != nil {
			tracks[i] = tr
		} else {
			tracks[i] = &musicdb.Track{
				Location: &res,
			}
			name := item.Title()
			artist := item.Creator()
			album := item.Album()
			tn := item.OriginalTrackNumber()
			cover := item.AlbumArtURI()
			if name != "" {
				tracks[i].Name = &name
			}
			if artist != "" {
				tracks[i].Artist = &artist
			}
			if album != "" {
				tracks[i].Album = &album
			}
			if tn != "" {
				// TODO
				tracks[i].Work = &tn
			}
			if cover != "" {
				tracks[i].ArtworkURL = &cover
			}
		}
	}
	q, err := s.GetPlaybackStatus()
	if err != nil {
		xerr = errors.Wrap(err, "can't get playback status")
		return
	}
	q.Tracks = tracks
	pos, err := s.GetQueuePos()
	if err != nil {
		xerr = errors.Wrap(err, "can't get queue position")
		return
	}
	q.Index = pos.Index
	q.Duration = pos.Duration
	q.Time = pos.Time
	vol, err := s.GetVolume()
	if err != nil {
		xerr = errors.Wrap(err, "can't get volume")
		return
	}
	q.Volume = vol
	mode, err := s.GetPlayMode()
	if err != nil {
		xerr = errors.Wrap(err, "can't get play mode")
		return
	}
	q.PlayMode = mode
	queue = q
	return
}

func (s *Sonos) trackUri(track *musicdb.Track) string {
	ext := filepath.Ext(track.Path())
	path := "/api/track/" + track.PersistentID.String() + ext
	u, _ := url.Parse(path)
	ref := s.rootUrl.ResolveReference(u)
	return ref.String()
}

func (s *Sonos) playlistUri(pl *musicdb.Playlist) string {
	path := "/api/playlist/" + pl.PersistentID.String() + "/tracks.m3u"
	u, _ := url.Parse(path)
	ref := s.rootUrl.ResolveReference(u)
	return ref.String()
}

func (s *Sonos) coverUri(track *musicdb.Track) string {
	ext := ".jpg"
	path := "/api/cover/" + track.PersistentID.String() + ext
	u, _ := url.Parse(path)
	ref := s.rootUrl.ResolveReference(u)
	return ref.String()
}

func (s *Sonos) didlLite(track *musicdb.Track) string {
	trackId := track.PersistentID.String()
	mediaUri := s.trackUri(track)
	duration := "0:00"
	if track.TotalTime != nil {
		hours := *track.TotalTime / 3600000
		mins := (*track.TotalTime % 3600000) / 60000
		secs := (*track.TotalTime % 60000) / 1000
		duration = fmt.Sprintf("%d:%02d:%02d", hours, mins, secs)
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

func (s *Sonos) didlLitePl(pl *musicdb.Playlist) string {
	plId := pl.PersistentID.String()
	//mediaUri := s.playlistUri(pl)
	return fmt.Sprintf(`<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
	<item id="playlists:%s" parentID="playlists:%s" restricted="true">
		<dc:title>Playlists</dc:title>
		<upnp:class>object.container</upnp:class>
		<desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">%s</desc>
	</item>
</DIDL-Lite>`, plId, plId, pl.Name)
}

func (s *Sonos) PrepareQueue() error {
	info, err := s.player.GetMediaInfo(0)
	if err != nil {
		return errors.Wrap(err, "can't get current media info")
	}
	if info.CurrentURI == "" {
		_, err = s.UseQueue("Q:0")
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Sonos) ClearQueue() error {
	err := s.player.Stop(0)
	if err != nil {
		return errors.Wrap(err, "can't stop player")
	}
	err = s.player.RemoveAllTracksFromQueue(0)
	if err != nil {
		return errors.Wrap(err, "can't remove tracks from player queue")
	}
	return nil
}

func (s *Sonos) ReplaceQueue(tracks []*musicdb.Track) error {
	err := s.ClearQueue()
	if err != nil {
		return errors.Wrap(err, "can't clear queue")
	}
	err = s.AppendToQueue(tracks)
	if err != nil {
		return err
	}
	return s.SetQueuePosition(0)
}

func (s *Sonos) ReplaceQueueWithPlaylist(pl *musicdb.Playlist) error {
	err := errors.Wrap(s.ClearQueue(), "can't clear queue")
	if err != nil {
		return err
	}
	return s.AppendPlaylistToQueue(pl)
}

func (s *Sonos) AppendToQueue(tracks []*musicdb.Track) error {
	for _, track := range tracks {
		uri := s.trackUri(track)
		req := &upnp.AddURIToQueueIn{
			EnqueuedURI: uri,
			EnqueuedURIMetaData: s.didlLite(track),
		}
		_, err := s.player.AddURIToQueue(0, req)
		if err != nil {
			return errors.Wrapf(err, "can't add track %s to player queue", uri)
		}
	}
	return nil
}

func (s *Sonos) AppendPlaylistToQueue(pl *musicdb.Playlist) error {
	uri := s.playlistUri(pl)
	req := &upnp.AddURIToQueueIn{
		EnqueuedURI: uri,
		EnqueuedURIMetaData: s.didlLitePl(pl),
	}
	_, err := s.player.AddURIToQueue(0, req)
	if err != nil {
		return errors.Wrapf(err, "can't add playlist %s to player queue", uri)
	}
	return nil
}

func (s *Sonos) InsertIntoQueue(tracks []*musicdb.Track, pos int) error {
	for i, track := range tracks {
		uri := s.trackUri(track)
		req := &upnp.AddURIToQueueIn{
			EnqueuedURI: uri,
			EnqueuedURIMetaData: s.didlLite(track),
			DesiredFirstTrackNumberEnqueued: uint32(pos + i + 1),
		}
		_, err := s.player.AddURIToQueue(0, req)
		if err != nil {
			return errors.Wrapf(err, "can't insert track %s into player queue at %d", uri, pos + i + 1)
		}
	}
	return nil
}

func (s *Sonos) InsertPlaylistIntoQueue(pl *musicdb.Playlist, pos int) error {
	uri := s.playlistUri(pl)
	req := &upnp.AddURIToQueueIn{
		EnqueuedURI: uri,
		EnqueuedURIMetaData: s.didlLitePl(pl),
		DesiredFirstTrackNumberEnqueued: uint32(pos + 1),
	}
	_, err := s.player.AddURIToQueue(0, req)
	if err != nil {
		return errors.Wrapf(err, "can't insert playlist %s into player queue at %d", uri, pos + 1)
	}
	return nil
}

func (s *Sonos) Play() error {
	return errors.Wrap(s.player.Play(0, "1"), "can't start player")
}

func (s *Sonos) Pause() error {
	return errors.Wrap(s.player.Pause(0), "can't pause player")
}

func (s *Sonos) SetQueuePosition(pos int) error {
	return errors.Wrapf(s.player.Seek(0, "TRACK_NR", strconv.Itoa(pos + 1)), "can't skip player to %d", pos + 1)
}

func (s *Sonos) SeekTo(ms int) error {
	hr := ms / 3600000
	min := (ms % 3600000) / 60000
	sec := (ms % 60000) / 1000
	ts := fmt.Sprintf("%d:%02d:%02d", hr, min, sec)
	return errors.Wrap(s.player.Seek(0, "REL_TIME", ts), "can't seek player to " + ts)
}

func (s *Sonos) SkipForward() error {
	return errors.Wrap(s.Skip(1), "can't skip player forward 1")
}

func (s *Sonos) SkipBackward() error {
	return errors.Wrap(s.Skip(-1), "can't skip player backward 1")
}

func (s *Sonos) Skip(n int) error {
	q, err := s.GetQueuePos()
	if err != nil {
		return errors.Wrap(err, "can't get queue position for skip")
	}
	return errors.Wrapf(s.SetQueuePosition(q.Index + n), "can't skip queue to position %d", q.Index + 1)
}

func (s *Sonos) Seek(ms int) error {
	q, err := s.GetQueuePos()
	if err != nil {
		return errors.Wrap(err, "can't get queue position for seek")
	}
	t := q.Time + ms
	if t >= q.Duration {
		return errors.Wrap(s.Skip(1), "can't seek to next track")
	}
	if t < 0 {
		t = 0
	}
	return errors.Wrapf(s.SeekTo(t), "can't seek to %d ms", t)
}

func (s *Sonos) GetVolume() (int, error) {
	vol, err := s.player.GetVolume(0, "Master")
	if err != nil {
		return -1, errors.Wrap(err, "can't get player volume")
	}
	return int(vol), nil
}

func (s *Sonos) SetVolume(vol int) error {
	if vol > 100 {
		vol = 100
	} else if vol < 0 {
		vol = 0
	}
	return errors.Wrapf(s.player.SetVolume(0, "Master", uint16(vol)), "can't set player volume to %d", vol)
}

func (s *Sonos) AlterVolume(delta int) error {
	vol, err := s.GetVolume()
	if err != nil {
		return errors.Wrap(err, "can't get current volume")
	}
	return errors.Wrapf(s.SetVolume(vol + delta), "can't add %d to current volume %d", delta, vol)
}

func (s *Sonos) Next() error {
	return errors.Wrap(s.player.Next(0), "can't skip to next track")
}

func (s *Sonos) SetTrack(tr *musicdb.Track) error {
	u := s.trackUri(tr)
	return errors.Wrapf(s.player.SetAVTransportURI(0, u, ""), "can't set track url to %s", u)
}

func (s *Sonos) ListActions() ([]string, error) {
	actions, err := s.player.GetCurrentTransportActions(0)
	return actions, errors.Wrap(err, "can't get transport actions")
}

type SQ struct {
	ID string
	ParentID string
	Restricted bool
	Res string
	Title string
	Class string
	AlbumArtURI string
	Creator string
	Album string
	OriginalTrackNumber string
	IsContainer bool
	Type string
}

func objectToSq(obj model.Object) *SQ {
	return &SQ{
		ID: obj.ID(),
		ParentID: obj.ParentID(),
		Restricted: obj.Restricted(),
		Res: obj.Res(),
		Title: obj.Title(),
		Class: obj.Class(),
		AlbumArtURI: obj.AlbumArtURI(),
		Creator: obj.Creator(),
		Album: obj.Album(),
		OriginalTrackNumber: obj.OriginalTrackNumber(),
		IsContainer: obj.IsContainer(),
		Type: fmt.Sprintf("%T", obj),
	}
}

func (s *Sonos) ListQueues() ([]*SQ, error) {
	queues, err := s.player.ListQueues()
	sqs := make([]*SQ, len(queues))
	for i, q := range queues {
		sqs[i] = objectToSq(q)
	}
	return sqs, err
}

func (s *Sonos) UseQueue(id string) ([]*SQ, error) {
	queues, err := s.player.ListQueues()
	if err != nil {
		return nil, errors.Wrap(err, "can't list queues")
	}
	for _, q := range queues {
		if q.ID() == id {
			u := q.Res()
			err := s.player.SetAVTransportURI(0, u, "")
			if err != nil {
				return nil, errors.Wrapf(err, "can't set default queue %s", u)
			}
			items, err := s.player.ListChildren(q.ID())
			if err != nil {
				return nil, errors.Wrap(err, "can't get queue contents")
			}
			sqs := make([]*SQ, len(items))
			for i, item := range items {
				sqs[i] = objectToSq(item)
			}
			return sqs, nil
		}
	}
	return nil, errors.New("default queue not found")
}

func (s *Sonos) GetChildren(id string) ([]*SQ, error) {
	var items []model.Object
	var err error
	if id == "" {
		items, err = s.player.GetRootLevelChildren()
	} else {
		items, err = s.player.ListChildren(id)
	}
	sqs := make([]*SQ, len(items))
	for i, item := range items {
		sqs[i] = objectToSq(item)
	}
	return sqs, errors.Wrapf(err, "can't get children of %s", id)
}

func (s *Sonos) GetMediaInfo() (*upnp.MediaInfo, error) {
	return s.player.GetMediaInfo(0)
}

/*
func (s *Sonos) Events() chan interface{} {
	return s.reactor.Channel()
}
*/

func parseDidl(data string) ([]*musicdb.Track, error) {
	//log.Println("parseDidl", data)
	doc := &didl.Lite{}
	xml.Unmarshal([]byte(data), doc)
	tracks := make([]*musicdb.Track, len(doc.Item))
	for i, item := range doc.Item {
		var title, artist string
		id := new(musicdb.PersistentID)
		var dur uint
		if len(item.Title) > 0 {
			title = item.Title[0].Value
		}
		if len(item.Creator) > 0 {
			artist = item.Creator[0].Value
		}
		id.Decode(item.ID)
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
				dur = uint(durD.Seconds() * 1000.0)
			}
		}
		tracks[i] = &musicdb.Track{
			PersistentID: *id,
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
	data, err := json.Marshal(nu.String())
	return data, errors.Wrap(err, "can't json marshal url")
}

func ParseJSONURL(val string) (*JSONURL, error) {
	u, err := url.Parse(val)
	if err != nil {
		return nil, errors.Wrap(err, "can't parse url " + val)
	}
	ju := JSONURL(*u)
	return &ju, nil
}

type AVTransportEvent struct {
	TransportState string `json:"state"`
	CurrentPlayMode int `json:"mode"`
	CurrentCrossfadeMode int `json:"crossfade_mode"`
	QueueLength int `json:"queue_length"`
	QueuePosition int `json:"queue_position"`
	CurrentSection int `json:"section,omitempty"`
	CurrentTrackURI *JSONURL `json:"current_track_uri,omitempty"`
	CurrentTrack *musicdb.Track `json:"current_track,omitempty"`
	NextTrackURI *JSONURL `json:"next_track_uri,omitempty"`
	NextTrack *musicdb.Track `json:"next_track,omitempty"`
	EnqueuedTrackURI *JSONURL `json:"enqueued_track_uri,omitempty"`
	EnqueuedTrack *musicdb.Track `json:"enqueued_track,omitempty"`
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
			}
			switch change.CurrentPlayMode.Val {
			case upnp.PlayMode_NORMAL:
				pretty.CurrentPlayMode = 0
			case upnp.PlayMode_REPEAT_ALL:
				pretty.CurrentPlayMode = PlayModeRepeat
			case upnp.PlayMode_SHUFFLE_NOREPEAT:
				pretty.CurrentPlayMode = PlayModeShuffle
			case upnp.PlayMode_SHUFFLE:
				pretty.CurrentPlayMode = PlayModeShuffle | PlayModeRepeat
			}
			pretty.CurrentCrossfadeMode, _ = strconv.Atoi(change.CurrentCrossfadeMode.Val)
			pretty.QueueLength, _ = strconv.Atoi(change.NumberOfTracks.Val)
			pretty.QueuePosition, _ = strconv.Atoi(change.CurrentTrack.Val)
			pretty.QueuePosition--
			pretty.CurrentTrackURI, _ = ParseJSONURL(change.CurrentTrackURI.Val)
			tracks, err := parseDidl(change.CurrentTrackMetaData.Val)
			if err == nil && len(tracks) == 1 {
				if tracks[0].TotalTime == nil {
					durT, err := time.Parse("15:04:05", change.CurrentTrackDuration.Val)
					if err == nil {
						durD := durT.Sub(refTime)
						dur := uint(durD.Seconds() * 1000.0)
						tracks[0].TotalTime = &dur
					}
				}
				pretty.CurrentTrack, _ = s.db.GetTrack(tracks[0].PersistentID)
				if pretty.CurrentTrack == nil {
					pretty.CurrentTrack = tracks[0]
				}
			}
			pretty.NextTrackURI, _ = ParseJSONURL(change.NextTrackURI.Val)
			tracks, err = parseDidl(change.CurrentTrackMetaData.Val)
			if err == nil && len(tracks) > 0 {
				pretty.NextTrack, _ = s.db.GetTrack(tracks[0].PersistentID)
				if pretty.NextTrack == nil {
					pretty.NextTrack = tracks[0]
				}
			}
			pretty.EnqueuedTrackURI, _ = ParseJSONURL(change.EnqueuedTransportURI.Val)
			tracks, err = parseDidl(change.EnqueuedTransportURIMetaData.Val)
			if err == nil && len(tracks) > 0 {
				pretty.EnqueuedTrack, _ = s.db.GetTrack(tracks[0].PersistentID)
				if pretty.EnqueuedTrack == nil {
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
			log.Printf("sonos event: %T %#v", evt, evt)
			return evt, nil
	}
	return nil, nil
}
