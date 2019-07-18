package httpserver

import (
	"fmt"
	"log"
	"net/http"
)

type Redirect string

type StaticFile string

type WebSocket string

type HandlerFunc func(w http.ResponseWriter, req *http.Request) (interface{}, error)

type hf HandlerFunc
func (h hf) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	obj, err := h(w, req)
	if err != nil {
		herr, isa := err.(*HTTPError)
		if isa {
			herr.Respond(w)
			return
		}
		InternalServerError.Raise(err, "Internal Server Error").Respond(w)
		return
	}
	if obj != nil {
		switch tobj := obj.(type) {
		case Redirect:
			http.Redirect(w, req, string(tobj), http.StatusFound)
		case StaticFile:
			http.ServeFile(w, req, string(tobj))
		case WebSocket:
			// noop
		case *HTTPError:
			tobj.RespondJSON(w)
		default:
			SendJSON(w, obj)
		}
	}
}

type Server struct {
	cfg *ServerConfig
	mux *http.ServeMux
}

func NewServer(cfg *ServerConfig) (*Server, error) {
	err := checkRunning(cfg)
	if err != nil {
		return nil, err
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
		return err
	}
	err = checkRunning(srv.cfg)
	if err != nil {
		return err
	}
	err = writePidfile(srv.cfg)
	if err != nil {
		return err
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

