package radio

import (
	"encoding/json"
	//"errors"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/dhowden/tag"
	"github.com/tcolgate/mp3"
)

type Stream struct {
	Name string `json:"name"`
	station Station
	startTime time.Time
	bufTime time.Time
	clientLock *sync.Mutex
	clients []*Client
	bufferDuration time.Duration
	buffer *Buffer
	idle bool
	wake chan bool
	current string
	closed bool
}

func NewStream(name string, station Station) (*Stream, error) {
	now := time.Now()
	s := &Stream{
		Name: name,
		station: station,
		startTime: now,
		bufTime: now,
		clientLock: &sync.Mutex{},
		clients: []*Client{},
		bufferDuration: time.Second * 8,
		buffer: NewBuffer(500),
		idle: true,
		wake: make(chan bool, 1),
		current: "",
		closed: false,
	}
	go s.run()
	return s, nil
}

func (s *Stream) MarshalJSON() ([]byte, error) {
	data := map[string]interface{}{
		"name": s.Name,
		"description": s.station.Description(),
		"clients": len(s.clients),
	}
	if s.current != "" {
		name := strings.TrimSuffix(filepath.Base(s.current), filepath.Ext(s.current))
		name = strings.ReplaceAll(name, "_", " ")
		cur := map[string]interface{}{
			"name": name,
		}
		data["current"] = cur
		f, err := os.Open(s.current)
		if err == nil {
			defer f.Close()
			meta, err := tag.ReadFrom(f)
			if err == nil {
				tname := meta.Title()
				if tname != "" {
					cur["name"] = tname
				}
				alb := meta.Album()
				if alb != "" {
					cur["album"] = alb
				}
				art := meta.Artist()
				if art != "" {
					cur["artist"] = art
				}
				art = meta.AlbumArtist()
				if art != "" {
					cur["album_artist"] = art
				}
				art = meta.Composer()
				if art != "" {
					cur["composer"] = art
				}
				year := meta.Year()
				if year != 0 {
					cur["year"] = year
				}
				gen := meta.Genre()
				if gen != "" {
					cur["genre"] = gen
				}
				tn, tc := meta.Track()
				if tn != 0 {
					cur["track_number"] = tn
					if tc != 0 {
						cur["track_count"] = tc
					}
				}
				dn, dc := meta.Disc()
				if dn != 0 {
					cur["disc_number"] = dn
					if dc != 0 {
						cur["disc_count"] = dc
					}
				}
			}
		}
	}
	return json.Marshal(data)
}

func (s *Stream) Connect() (*Client, io.ReadCloser) {
	s.clientLock.Lock()
	defer s.clientLock.Unlock()
	if s.closed {
		return nil, nil
	}
	var id uint64
	if len(s.clients) == 0 {
		id = 1
	} else {
		id = s.clients[len(s.clients) - 1].id + 1
	}
	c := &Client{
		id: id,
		s: s,
		closed: false,
		C: make(chan []byte, 1000),
		buf: []byte{},
	}
	br := s.buffer.Reader()
	s.clients = append(s.clients, c)
	if len(s.clients) == 1 {
		s.idle = false
		s.startTime = time.Now()
		s.bufTime = s.startTime
		s.wake <- true
	}
	return c, br
}

func (s *Stream) removeClient(c *Client) {
	s.clientLock.Lock()
	defer s.clientLock.Unlock()
	clients := make([]*Client, 0, len(s.clients) - 1)
	for _, x := range s.clients {
		if x != c {
			clients = append(clients, x)
		}
	}
	s.clients = clients
	if len(s.clients) == 0 {
		s.idle = true
	}
}

func (s *Stream) run() {
	errcnt := 0
	for {
		if s.closed {
			break
		}
		fn := s.station.Next()
		t, err := NewTranscoder(fn, 128000)
		if err != nil {
			errcnt++
			log.Println(err)
			if errcnt > 5 {
				log.Println("can't transcode any part of playlist")
				return
			}
			continue
		}
		s.current = fn
		errcnt = 0
		d := mp3.NewDecoder(t)
		var frame mp3.Frame
		skipped := 0
		for {
			if s.idle {
				log.Println("no clients connected, idling")
				<-s.wake
				log.Println("client connected, waking from idle")
			}
			if s.closed {
				break
			}
			err := d.Decode(&frame, &skipped)
			if err != nil {
				if err != io.EOF {
					log.Println("error decoding mp3 stream:", err)
				}
				break
			}
			fp := &frame
			buf, err := ioutil.ReadAll(fp.Reader())
			s.buffer.Write(buf)
			for _, c := range s.clients {
				c.write(buf)
			}
			s.bufTime = s.bufTime.Add(fp.Duration())
			delay := s.bufTime.Add(s.bufferDuration).Sub(time.Now())
			if delay > time.Millisecond {
				time.Sleep(delay)
			}
		}
		t.Close()
	}
}

func (s *Stream) Shutdown() {
	s.clientLock.Lock()
	s.closed = true
	if len(s.clients) == 0 {
		s.wake <- true
	}
	clients := make([]*Client, len(s.clients))
	for i, c := range s.clients {
		clients[i] = c
	}
	s.clientLock.Unlock()
	for _, c := range clients {
		c.Close()
	}
}

