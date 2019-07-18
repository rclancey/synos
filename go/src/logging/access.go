package logging

import (
	"bufio"
	"errors"
	"fmt"
	"net"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var addrRe = regexp.MustCompile("^(.*):([0-9]+)$")

type AccessLogger struct {
	*Logger
	server http.Handler
}

func NewAccessLogger(server http.Handler, fn string, level LogLevel, rotate time.Duration, retain int) (*AccessLogger, error) {
	logger, err := NewLogger(fn, level, rotate, retain)
	if err != nil {
		return nil, err
	}
	return &AccessLogger{logger, server}, nil
}

func (l *AccessLogger) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	rl := NewResponseLogger(w, r)
	l.server.ServeHTTP(rl, r)
	dt := time.Now().Sub(rl.start)
	var ip string
	if strings.HasPrefix(rl.r.RemoteAddr, "[::1]:") {
		ip = "127.0.0.1"
	} else {
		parts := addrRe.FindStringSubmatch(rl.r.RemoteAddr)
		if parts != nil && len(parts) > 1 {
			ip = parts[1]
		} else {
			ip = rl.r.RemoteAddr
		}
	}
	f := `%s [%s] "%s %s" %d %d %.3f "%s" "%s"` + "\n"
	args := []interface{}{
		ip,
		rl.start.Format("2006-01-02 15:04:05 -0700"),
		//rl.start.Format("02/Jan/2006:15:04:05 -0700"),
		rl.r.Method,
		rl.r.URL.String(),
		rl.statusCode,
		rl.bytesWritten,
		float64(dt) / 1.0e6,
		rl.r.Referer(),
		rl.r.UserAgent(),
	}
	l.Logger.Write([]byte(fmt.Sprintf(f, args...)))
}

type ResponseLogger struct {
	w http.ResponseWriter
	r *http.Request
	start time.Time
	bytesWritten int
	statusCode int
}

func NewResponseLogger(w http.ResponseWriter, r *http.Request) *ResponseLogger {
	return &ResponseLogger{
		w: w,
		r: r,
		start: time.Now(),
		bytesWritten: 0,
		statusCode: 0,
	}
}

func (rl *ResponseLogger) Header() http.Header {
	return rl.w.Header()
}

func (rl *ResponseLogger) WriteHeader(statusCode int) {
	rl.statusCode = statusCode
	rl.w.WriteHeader(statusCode)
}

func (rl *ResponseLogger) Write(data []byte) (int, error) {
	if rl.statusCode == 0 {
		rl.statusCode = http.StatusOK
	}
	rl.bytesWritten += len(data)
	return rl.w.Write(data)
}

func (rl *ResponseLogger) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hj, ok := rl.w.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("webserver doesn't support hijacking")
	}
	return hj.Hijack()
}

