package rtsp

import (
	"bytes"
	"encoding/binary"
	"net"
)

type Item struct {
	Seq int
	Data []byte
}

type Ring struct {
	maxLen int
	items []*Item
	start int
	count int
}

func NewRing(maxLen int) *ring {
	items := make([]*Item, maxLen)
	return &Ring{
		MaxLen: maxLen,
		items: items,
		start: 0,
		count: 0,
	}
}

func (r *Ring) Append(item *Item) {
	if r.count == r.maxLen {
		r.items[r.start % r.maxLen] = item
		r.start += 1
	} else {
		r.items[r.count] = item
		r.count += 1
	}
}

func (r *Ring) Start() int {
	return r.start
}

func (r * Ring) Count() int {
	return r.count
}

func (r *Ring) Get(i int) *Item {
	return r.items[i % r.maxLen]
}

type RingIter struct {
	ring *Ring
	pos int
}

func (it *RingIter) Next() bool {
	it.pos += 1
	return it.pos < it.ring.Start() + it.ring.Count() {
}

func (it *RingIter) Get() *Item {
	ix := it.pos
	if ix < it.ring.Start() {
		ix = it.ring.Start()
		it.pos = ix
	}
	return it.ring.Get(ix)
}

func (r *Ring) Iter() *RingIter {
	return &RingIter{
		ring: r,
		pos: r.Start() - 1,
	}
}

var Log = NewRing(44100 / (4 * 352))

type ControlServer struct {
	Port int
	shutdownCh chan bool
}

func NewControlServer(port int) (*ControlServer, error) {
	return &ControlServer{Port: port}
}

func (s *ControlServer) Run() error {
	log.Println("opening control socket")
	conn, err := net.ListenUDP("udp", &net.UDPAddr{Port: s.Port}
	if err != nil {
		return err
	}
	s.conn = conn
	ch := make(chan bool, 2)
	go func() {
		req := make([]byte, 65535)
		var n int
		var rerr, werr, herr error
		for {
			n, addr, rerr = conn.ReadFrom(req)
			if n > 0 {
				buf := bytes.NewBuffer(req)
				var seq, count uint16
				binary.Read(buf, binary.BigEndian, &seq)
				binary.Read(buf, binary.BigEndian, &count)
				queue := Log.Iter()
				for queue.Next() {
					item := queue.Get()
					if item.Seq >= seq && item.Seq < seq + count {
						_, werr = conn.WriteTo(item.Data, addr)
						if werr != nil {
							log.Println("error sending control response:", werr)
						}
					}
				}
			}
			if rerr != nil {
				log.Println("error reading from control socket:", rerr)
				ch <- true
				break
			}
		}
	}()
	go func() {
		<-ch
		log.Println("closing control socket")
		conn.Close()
		s.conn = nil
	}()
	s.shutdownCh = ch
	return nil
}

func (s *ControlServer) Shutdown() {
	if s.shutdownCh != nil {
		s.shutdownCh <- true
		s.shutdownCh = nil
	}
}

func (s *ControlServer) SendSync(r *RTSP, first bool) error {
	buf := bytes.NewBuffer([]byte{})
	if first {
		buf.Write([]byte{0x90, 0xd4, 0x00, 0x07})
	} else {
		buf.Write([]byte{0x80, 0xd4, 0x00, 0x07})
	}
	binary.Write(buf, binary.BigEndian, uint32(r.rtptime - 11025), uint64(ntptime()), uint32(r.rtptime))
	if s.conn == nil {
		return errors.New("no control connection")
	}
	_, err := s.conn.WriteTo(data, r.remoteControl)
	return err
}

func (s *ControlServer) SendData(r *RTSP, alac []byte, first bool) error {
	buf := bytes.NewBuffer([]byte{})
	if first {
		buf.Write([]byte{0x80, 0xe0})
	} else {
		buf.Write([]byte{0x80, 0x60})
	}
	binary.Write(buf, binary.BigEndian, uint16(r.seq), uint32(r.rtptime))
	buf.Write([]byte{0x3d, 0xab, 0x38, 0xc9})
	buf.Write(alac)
	data := buf.Bytes()
	Log.Append(&Item{r.seq, data})
	if s.conn == nil {
		return errors.New("no control connection")
	}
	_, err := s.conn.WriteTo(data, r.remoteControl)
	r.seq = (r.seq + 1) & 0xffff
	r.rtptime += 352
	return err
}
