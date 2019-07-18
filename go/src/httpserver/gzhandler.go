package httpserver

import (
	"bufio"
	"compress/gzip"
	"errors"
	"net"
	"net/http"
	"strings"
)

type GZipResponseWriter struct {
	w http.ResponseWriter
	acceptGzip bool
	gzw *gzip.Writer
}

func NewGZipResponseWriter(w http.ResponseWriter, r *http.Request) *GZipResponseWriter {
	encs := strings.Split(r.Header.Get("Accept-Encoding"), ",")
	accept := false
	for _, enc := range encs {
		if strings.ToLower(strings.TrimSpace(enc)) == "gzip" {
			accept = true
			break
		}
	}
	return &GZipResponseWriter{w: w, acceptGzip: accept, gzw: nil}
}

func (w *GZipResponseWriter) Header() http.Header {
	return w.w.Header()
}

func (w *GZipResponseWriter) WriteHeader(statusCode int) {
	if statusCode == http.StatusOK && w.acceptGzip {
		h := w.w.Header()
		ct := strings.Split(h.Get("Content-Type"), ";")[0]
		if strings.HasPrefix(ct, "text/") {
			enc := strings.ToLower(h.Get("Content-Encoding"))
			if enc == "" {
				h.Set("Content-Encoding", "gzip")
				w.gzw = gzip.NewWriter(w.w)
			}
		}
	}
	w.w.WriteHeader(statusCode)
}

func (w *GZipResponseWriter) Write(data []byte) (int, error) {
	if w.gzw != nil {
		return w.gzw.Write(data)
	}
	return w.w.Write(data)
}

func (w *GZipResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hj, ok := w.w.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("websaerver doesn't support hijacking")
	}
	return hj.Hijack()
}

