package httpserver

import (
	"bufio"
	"compress/gzip"
	"log"
	"net"
	"net/http"
	"strings"

	"github.com/pkg/errors"
)

type GZipResponseWriter struct {
	w http.ResponseWriter
	acceptGzip bool
	gzw *gzip.Writer
	path string
}

func NewGZipResponseWriter(w http.ResponseWriter, r *http.Request) *GZipResponseWriter {
	accept := false
	if r.Header.Get("Range") == "" {
		if strings.ToLower(strings.TrimSpace(r.Header.Get("Connection"))) != "upgrade" {
			encs := strings.Split(r.Header.Get("Accept-Encoding"), ",")
			for _, enc := range encs {
				if strings.ToLower(strings.TrimSpace(enc)) == "gzip" {
					accept = true
					break
				}
			}
		}
	}
	//log.Printf("request %s allows gzip", r.URL.Path)
	return &GZipResponseWriter{w: w, acceptGzip: accept, gzw: nil, path: r.URL.Path}
}

func (w *GZipResponseWriter) Header() http.Header {
	return w.w.Header()
}

func (w *GZipResponseWriter) WriteHeader(statusCode int) {
	if statusCode == http.StatusOK && w.acceptGzip {
		h := w.w.Header()
		ct := strings.Split(h.Get("Content-Type"), ";")[0]
		if strings.HasPrefix(ct, "text/") || ct == "application/json" || ct == "application/javascript" {
			enc := strings.ToLower(h.Get("Content-Encoding"))
			if enc == "" {
				//log.Printf("response for %s can be gzipped", w.path)
				h.Set("Content-Encoding", "gzip")
				h.Del("Content-Length")
				w.gzw = gzip.NewWriter(w.w)
			} else {
				log.Printf("response for %s already has content encoding", w.path)
			}
		//} else {
		//	log.Printf("response for %s can't be compressed (type = %s)", w.path, ct)
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

func (w *GZipResponseWriter) Close() error {
	if w.gzw != nil {
		return w.gzw.Close()
	}
	return nil
}

func (w *GZipResponseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	hj, ok := w.w.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("websaerver doesn't support hijacking")
	}
	return hj.Hijack()
}

