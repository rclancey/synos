package httpserver

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"path"
	"path/filepath"
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

type handler struct {
	srv *Server
	f HandlerFunc
}

func (h *Handler) sendError(ctx context.Context, w http.ResponseWriter, err error) {
	herr, isa := err.(HTTPError)
	if !isa {
		herr = InternalServerError.Wrap(err, "")
	}
	l, err := logging.FromContext(ctx)
}

func (h *handler) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	if err != nil {
		log.Println("error creating request context:", err)
	}
	defer req.Body.Close()
	gzrw := NewGZipResponseWriter(w, req)
	reqId := FromContext(req)
	gzrw.Header().Set("X-Request-Id", reqId)
	obj, err := h.f(gzrw, req)
	if err != nil {
		h.sendError(w, err)
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
				SendError(w, BadRequest.Wrap(err, "Invalid downstream server"))
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
				SendError(w, BadGateway.Wrap(err, "Downstream server error"))
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
				SendError(w, InternalServerError.Wrap(err, "Can't upgrade connection"))
				return
			}
			err = tobj.Open(conn)
			if err != nil {
				tobj.Close()
				SendError(w, InternalServerError.Wrap(err, "Can't open websocket"))
				return
			}
			go tobj.WritePump()
			go tobj.ReadPump()
		case HTTPError:
			gzrw.Header().Set("Content-Type", "application/json")
			gzrw.WriteHeader(tobj.StatusCode())
			data, _ := json.MarshalJSON(tobj)
			gzrw.Write(data)
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

func FileServer(docRoot string) HandlerFunc {
	return func(w http.ResponseWriter, req *http.Request) (interface{}, error) {
		rel := filepath.FromSlash(path.Clean(req.URL.Path))
		fn := filepath.Join(docRoot, rel)
		return StaticFile(fn), nil
	}
}

func (srv *Server) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	errlog, _ := srv.cfg.Logging.ErrorLogger()
	ctx, _ = logging.NewContext(ctx, errlog)
	ctx, _ = NewRequestIdContext(ctx)
	req = req.Clone(ctx)
	srv.mux.ServeHTTP(w, req)
}

func (srv *Server) ListenAndServe() error {
	//srv.mux.Handle("/", http.FileServer(http.Dir(srv.cfg.DocumentRoot)))
	srv.Handle("/", FileServer(srv.cfg.DocumentRoot))
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

