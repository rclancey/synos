package main

import (
	"net/http"
)

type Redirect string

type StaticFile string

type HandlerFunc func(w http.ResponseWriter, req *http.Request) (interface{}, error)

func (h HandlerFunc) ServeHTTP(w http.ResponseWriter, req *http.Request) {
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
		case *HTTPError:
			tobj.RespondJSON(w)
		default:
			SendJSON(w, obj)
		}
	}
}

