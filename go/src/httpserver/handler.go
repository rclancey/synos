package httpserver

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/pkg/errors"
)

type Redirect string

type StaticFile string

type WebSocket interface {
	Open(*websocket.Conn) error
	ReadPump()
	WritePump()
	Close()
}

type ProxyURL string

func SetDefaultContentType(w http.ResponseWriter, ct string) {
	h := w.Header()
	if h.Get("Content-Type") == "" {
		h.Set("Content-Type", ct)
	}
}

type HandlerFunc func(w http.ResponseWriter, req *http.Request) (interface{}, error)

type hf HandlerFunc
func (h hf) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	defer req.Body.Close()
	gzrw := NewGZipResponseWriter(w, req)
	obj, err := h(gzrw, req)
	if err != nil {
		herr, isa := err.(*HTTPError)
		if isa {
			herr.Respond(w)
			return
		}
		InternalServerError.Raise(err, "Internal Server Error").Respond(gzrw)
		return
	}
	if obj != nil {
		switch tobj := obj.(type) {
		case Redirect:
			http.Redirect(gzrw, req, string(tobj), http.StatusFound)
		case StaticFile:
			http.ServeFile(gzrw, req, string(tobj))
		case io.ReadSeeker:
			http.ServeContent(gzrw, req, req.URL.Path, time.Now(), tobj)
			closer, isa := tobj.(io.Closer)
			if isa {
				defer closer.Close()
			}
		case []byte:
			http.ServeContent(gzrw, req, req.URL.Path, time.Now(), bytes.NewReader(tobj))
		case ProxyURL:
			client := &http.Client{}
			preq, err := http.NewRequest(req.Method, string(tobj), req.Body)
			if err != nil {
				BadRequest.Raise(err, "Invalid downstream server").Respond(gzrw)
				return
			}
			for k, vs := range req.Header {
				switch k {
				case "Host":
				default:
					preq.Header[k] = vs
				}
			}
			preq.Header.Set("X-Forwarded-For", req.RemoteAddr)
			res, err := client.Do(preq)
			if err != nil {
				BadGateway.Raise(err, "Downstream server error").Respond(gzrw)
				return
			}
			wh := w.Header()
			for k, vs := range res.Header {
				wh[k] = vs
			}
			gzrw.WriteHeader(res.StatusCode)
			io.Copy(gzrw, res.Body)
			res.Body.Close()
		case WebSocket:
			conn, err := upgrader.Upgrade(gzrw, req, nil)
			if err != nil {
				tobj.Close()
				InternalServerError.Raise(err, "Can't upgrade connection").Respond(gzrw)
				return
			}
			err = tobj.Open(conn)
			if err != nil {
				tobj.Close()
				InternalServerError.Raise(err, "Can't open websocket").Respond(gzrw)
				return
			}
			go tobj.WritePump()
			go tobj.ReadPump()
		case *HTTPError:
			tobj.RespondJSON(gzrw)
		default:
			SendJSON(gzrw, obj)
		}
		gzrw.Close()
	}
}

type Server struct {
	cfg *ServerConfig
	mux *http.ServeMux
}

func NewServer(cfg *ServerConfig) (*Server, error) {
	err := checkRunning(cfg)
	if err != nil {
		return nil, errors.Wrap(err, "server already running")
	}
	return &Server{
		cfg: cfg,
		mux: http.NewServeMux(),
	}, nil
}

func (srv *Server) Handle(pattern string, handler HandlerFunc) {
	srv.mux.Handle(pattern, hf(handler))
}

func (srv *Server) ListenAndServe() error {
	srv.mux.Handle("/", http.FileServer(http.Dir(srv.cfg.DocumentRoot)))
	al, err := srv.cfg.Logging.AccessLogger(srv.mux)
	if err != nil {
		return errors.Wrap(err, "can't get access logger")
	}
	err = checkRunning(srv.cfg)
	if err != nil {
		return errors.Wrap(err, "server already running")
	}
	err = writePidfile(srv.cfg)
	if err != nil {
		return errors.Wrap(err, "can't write pid file")
	}
	defer removePidfile(srv.cfg)
	errch := make(chan error, 2)
	listeners := 0
	if srv.cfg.Bind.SSL.Enabled() {
		listeners += 1
		go func() {
			cfg := srv.cfg.Bind.SSL
			addr := fmt.Sprintf(":%d", cfg.Port)
			log.Println("listening for https on", addr)
			err := http.ListenAndServeTLS(addr, cfg.CertFile, cfg.KeyFile, al)
			errch <- err
		}()
	}
	if srv.cfg.Bind.Port != 0 {
		listeners += 1
		go func() {
			addr := fmt.Sprintf(":%d", srv.cfg.Bind.Port)
			log.Println("listening for http on", addr)
			err := http.ListenAndServe(addr, al)
			errch <- err
		}()
	}
	for listeners > 0 {
		err := <-errch
		listeners -= 1
		if err != nil {
			l, _ := srv.cfg.Logging.ErrorLogger()
			if l == nil {
				log.Fatal(err)
			} else {
				l.Fatal(err)
			}
		}
	}
	return nil
}

