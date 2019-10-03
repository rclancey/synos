package rtsp

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"net"
	"net/textproto"
	"net/url"
	"strconv"
	"strings"
)

const (
	MethodOptions = "OPTIONS"
	MethodAnnounce = "ANNOUNCE"
	MethodSetup = "SETUP"
	MethodRecord = "RECORD"
	MethodPause = "PAUSE"
	MethodFlush = "FLUSH"
	MethodTeardown = "TEARDOWN"
	MethodGetParameter = "GET_PARAMETER"
	MethodSetParameter = "SET_PARAMETER"
	MethodPost = "POST"
	MethodGet = "GET"

	StatusOK = 200
)

type Request struct {
	Method string
	URL *url.URL
	Header textproto.MIMEHeader
	Body io.ReadCloser
}

func NewRequest(method, urlstr string, header textproto.MIMEHeader, body io.ReadCloser) (*Request, error) {
	u, err := url.Parse(urlstr)
	if err != nil {
		return nil, err
	}
	return &Request{
		Method: method,
		URL: u,
		Header: header,
		Body: body,
	}, nil
}

var headerNewlineToSpace = strings.NewReplacer("\n", " ", "\r", " ")

func (req *Request) Write(w io.Writer) error {
	_, err := w.Write([]byte(fmt.Sprintf("%s %s RTSP/1.0\r\n", req.Method, req.URL.String()))
	if err != nil {
		return err
	for k, vs := range req.Header {
		for _, v := range vs {
			_, err = w.Write([]byte(fmt.Sprintf("%s: %s\r\n", textproto.CanonicalMIMEHeaderKey(k), headerNewlineToSpace.Replace(v))))
			if err != nil {
				return err
			}
		}
	}
	_, err = w.Write("\r\n")
	if err != nil {
		return err
	}
	if req.Body != nil {
		buf := make([]byte, 8192)
		var n int
		var rerr error
		for {
			n, rerr = req.Body.Read(buf)
			if n == 0 {
				break
			}
			_, err = w.Write(buf[:n])
			if err != nil {
				req.Body.Close()
				return err
			}
			if rerr == io.EOF {
				break
			}
			if rerr != nil && rerr != io.EOF {
				req.Body.Close()
				return rerr
			}
		}
		err = req.Body.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

type Response struct {
	Status string
	StatusCode int
	Proto string
	ProtoMajor int
	ProtoMinor int
	Header textproto.MIMEHeader
	Body io.ReadCloser
}

func parseProto(proto string) (name string, major, minor int, err error) {
	parts := strings.Split(proto, "/")
	if len(parts) != 2 {
		return "", -1, -1, errors.New("malformed proto")
	}
	name = parts[0]
	parts = strings.Split(parts[1], ".")
	if len(parts) != 2 {
		return proto, -1, -1, errors.New("malformed proto")
	}
	var err error
	major, err = strconv.Atoi(parts[0])
	if err != nil {
		return proto, -1, -1, errors.New("malformed proto")
	}
	minor, err = strconf.Atoi(parts[1])
	if err != nil {
		return proto, major, -1, errors.New("malformed proto")
	}
	return proto, major, minor, nil
}

func ReadResponse(r io.Reader) (*Response, error) {
	br := bufio.NewReader(r)
	tr := textproto.NewReader(br)
	line, err := tr.ReadLineBytes()
	if err != nil {
		return nil, err
	}
	res := &Response{}
	if i := strings.IndexByte(line, ' '); i == -1 {
		return nil, fmt.Errorf("malformed RTSP response: %s", string(line))
	} else {
		res.Proto = line[:i]
		res.Status = strings.TrimLeft(line[i+1:], " ")
	}
	statusCode := res.Status
	if i := strings.IndexByte(resp.Status, ' '); i != -1 {
		statusCode = resp.Status[:i]
	}
	res.StatusCode, err = strconv.Atoi(statusCode)
	if err != nil || res.StatusCode < 0 {
		return nil, fmt.Errorf("malformed RTSP response: %s", statusCode)
	}
	_, res.ProtoMajor, res.ProtoMinor, err = parseProto(res.Proto)
	if err != nil {
		return nil, fmt.Errorf("malformed RTSP response: %s", res.Proto)
	}
	res.Header, err = tr.ReadMIMEHeader()
	if err != nil {
		return nil, err
	}
	nstr := res.Header.Get("Content-Length")
	if nstr != "" {
		n, err := strconv.Atoi(nstr)
		if err != nil {
			return nil, err
		}
		data := make([]byte, n)
		_, err = br.Read(data)
		if err != nil {
			return nil, err
		}
		res.Body = bytes.NewBuffer(data)
	}
	return res, nil
}

type RTSP struct {
	conn net.Conn
	cseq int
	sessionId string
	clientId string
	userAgent string
	rtpTime int64
	seq int
}

func NewRTSP(host string, port int) (*RTSP, error) {
	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		return nil, err
	}
	return &RTSP{
		conn: conn,
		cseq: 1,
		sessionId: "3509167977",
		userAgent: "iTunes/12.7.3 (Macintosh; OS X 10.13.2) hwp/t8002 (dt:1)",
		rtpTime: 11025,
		seq: 0,
	}, nil
}

func (s *RTSP) IsOpen() bool {
	return s.conn != nil
}

func (s *RTSP) sendRequest(method, urlstr string, h textproto.MIMEHeader, body []byte) error {
	if !s.IsOpen() {
		return errors.New("no active connection")
	}
	if body != nil {
		h.Set("Content-Length", strconv.Itoa(len(body)))
	}
	h.Set("CSeq", strconv.Itoa(s.cseq))
	if h.Get("User-Agent") == "" && s.userAgent != "" {
		h.Set("User-Agent", s.userAgent)
	}
	if h.Get("Client-Instance") == "" && s.clientId != "" {
		h.Set("Client-Instance", s.clientId)
	}
	if h.Get("DACP-ID") == "" && s.dacpId != "" {
		h.Set("DCAP-ID", s.dcapId)
	}
	if h.Get("Active-Remote") == "" && s.remoteId != "" {
		h.Set("Active-Remote", s.remoteId)
	}
	if urlstr == "" {
		u := &url.URL{
			Scheme: "rtsp",
			Host: s.localIp,
			Path: "/" + s.sessionId,
		}
		urlstr = u.String()
	}
	req, err := NewRequest(method, urlstr, h, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	err = s.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
	if err != nil {
		return err
	}
	s.cseq += 1
	err = req.Write(s.conn)
	s.conn.SetWriteDeadline(time.Time{})
	if err != nil {
		return err
	}
	return nil
}

func (s *RTSP) readResponse() (*Response, error) {
	if !s.IsOpen() {
		return errors.New("no active connection")
	}
	err := s.conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	if err != nil {
		return nil, err
	}
	res, err := ReadResponse(s.conn)
	s.conn.SetReadDeadline(time.Time{})
	return res, err
}

func (s *RTSP) Do(method, url string, h textproto.MIMEHeader, body []byte) (*Response, error) {
	err := s.sendRequest(method, url, h, body)
	if err != nil {
		return nil, err
	}
	return s.readResponse()
}

func (s *RTSP) Close() error {
	err := s.conn.Close()
	if err != nil {
		return err
	}
	s.conn = nil
	return nil
}

func (s *RTSP) Announce() error {
	h := textproto.MIMEHeader{}
	h.Set("Content-Type", "application/sdp")
	body := []byte(fmt.Sprintf(`v=0
o=iTunes %s 0 IN IP4 %s
s=iTunes
c=IN IP4 %s
t=0 0
m=audio 0 RTP/AVP 96
a=rtpmap:96 AppleLossless
a=fmtp:96 352 0 16 40 10 14 2 255 0 0 44100`, s.sessionId, s.localIp, s.remoteIp))
	res, err := s.Do(MethodAnnounce, "", h, body)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
}

func (s *RTSP) Setup() error {
	h := textproto.MIMEHeader{}
	h.Set("Transport", fmt.Sprintf("RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;control_port=%d;timing_port=%d", s.control.Port, s.timing.Port))
	res, err := s.Do(MethodSetup, "", h, nil)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	parts := strings.Split(res.Header.Get("Transport"), ";")
	t := map[string]string{}
	for _, part := range parts {
		pair := strings.Split(part, "=")
		if len(pair) == 2 {
			t[pair[0]] = pair[1]
		}
	}
	port, ok := t["server_port"]
	if ok {
		s.remoteServerPort, err = strconv.Atoi(port)
		if err != nil {
			return err
		}
	}
	port, ok = t["control_port"]
	if ok {
		s.remoteControlPort, err = strconv.Atoi(port)
		if err != nil {
			return err
		}
	}
	port, ok = t["timing_port"]
	if ok {
		s.remoteTimingPort, err = strconv.Atoi(port)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *RTSP) Record() error {
	h := textproto.MIMEHeader{}
	h.Set("Session", "1")
	h.Set("Range", "npt=0-")
	h.Set("RTP-Info", fmt.Sprintf("seq=%d;rtptime=%d", s.seq, s.rtptime))
	res, err := s.Do(MethodRecord, "", h, nil)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}

func (s *RTSP) Flush() error {
	h := textproto.MIMEHeader{}
	h.Set("Session", "1")
	h.Set("RTP-Info", fmt.Sprintf("seq=%d;rtptime=%d", s.seq, s.rtptime))
	res, err := s.Do(MethodFlush, "", h, nil)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}

func (s *RTSP) Teardown() error {
	h := textproto.MIMEHeader{}
	h.Set("Session", "1")
	res, err := s.Do(MethodTeardown, "", h, nil)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}

func (s *RTSP) SetVolume(vol float64) error {
	h := textproto.MIMEHeader{}
	h.Set("Content-Type", "text/parameters")
	h.Set("Session", "1")
	body := []byte(fmt.Sprintf("volume: %.6f\r\n", vol))
	res, err := s.Do(MethodSetParameter, "", h, body)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}

func (s *RTSP) SetMetadata(track *itunes.Track) error {
	body, err := dmap.MarshalDMAP(track)
	if err != nil {
		return err
	}
	h := textproto.MIMEHeader{}
	h.Set("Content-Type", "application/x-dmap-tagged")
	h.Set("Session", "1")
	h.Set("RTP-Info", fmt.Sprintf("rtptime=%d", s.rtptime))
	res, err := s.Do(MethodSetParameter, "", h, body)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}

func (s *RTSP) SetCoverImage(filename string) error {
	f, err := os.Open(filename)
	if err != nil {
		return err
	}
	body, err := ioutil.ReadAll(f)
	if err != nil {
		return err
	}
	h := textproto.MIMEHeader{}
	h.Set("Content-Type", "image/jpeg")
	h.Set("Session", "1")
	h.Set("RTP-Info", fmt.Sprintf("rtptime=%d", s.rtptime))
	res, err := s.Do(MethodSetParameter, "", h, body)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}

func (s *RTSP) SetProgress(currentMs, durationMs int) error {
	start := s.msToRtpTime(0)
	cur := s.msToRtpTime(currentMs)
	end := s.msToRtpTime(durationMs)
	body := []byte(fmt.Sprintf("progress: %d/%d/%d\r\n", start, cur, end))
	h := textproto.MIMEHeader{}
	h.Set("Content-Type", "text/parameters")
	h.Set("Session", "1")
	res, err := s.Do(MethodSetParameter, "", h, body)
	if err != nil {
		return err
	}
	if res.StatusCode != StatusOK {
		return errors.New(res.Status)
	}
	return nil
}


