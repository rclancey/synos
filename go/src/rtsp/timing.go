package rtsp

import (
	"net"

	"github.com/davecheney/junk/clock"
)

// https://github.com/jim-minter/python-airtunes-server/blob/master/pytunes-server/clock.py
func ntptime() int64 {
	t := clock.Monotonic.Now()
	s := t.Unix()
	ns := int64(t.Nanosecond())
	return (2208988800 + s << 32) + (2**32 * ns / 1e9)
}

type TimingServer struct {
	Port int
	shutdownCh chan bool
}

func NewTimingServer(port int) (*TimingServer, error) {
	return &TimingServer{Port: port}, nil
}

func (s *TimingServer) Run() error {
	log.Println("opening timing socket")
	conn, err := net.ListenUDP("udp", &net.UDPAddr{Port: s.Port}
	if err != nil {
		return err
	}
	ch := make(chan bool, 2)
	go func() {
		req := make([]byte, 65535)
		var n int
		var rerr, werr, herr error
		for {
			n, addr, rerr = conn.ReadFrom(req)
			if n > 0 {
				buf := bytes.NewBuffer([]byte{})
				buf.Write([]byte{0x80, 0xd3, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00})
				buf.Write(req[24:32])
				binary.Write(buf, binary.BigEndian, ntptime())
				binary.Write(buf, binary.BigEndian, ntptime())
				_, werr = conn.WriteTo(buf.Bytes(), addr)
				if werr != nil {
					log.Println("error sending timing response:", werr)
				}
			}
			if rerr != nil {
				log.Println("error reading from timing socket:", rerr)
				ch <- true
				break
			}
		}
	}()
	go func() {
		<-ch
		log.Println("closing timing socket")
		conn.Close()
	}()
	s.shutdownCh = ch
	return nil
}

func (s *TimingServer) Shutdown() {
	if s.shutdownCh != nil {
		s.shutdownCh <- true
		s.shutdownCh = nil
	}
}


