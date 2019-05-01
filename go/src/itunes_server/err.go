package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
)

type HTTPError struct {
	Status int
	Err error
	Message string
}

func (e *HTTPError) Error() string {
	return e.Err.Error()
}

func (e *HTTPError) Raise(err error, message string, args ...interface{}) *HTTPError {
	msg := message
	if msg == "" {
		msg = e.Message
		if msg == "" && err != nil {
			msg = err.Error()
		}
	}
	if len(args) > 0 {
		msg = fmt.Sprintf(msg, args...)
	}
	if err == nil {
		err = errors.New(msg)
	}
	return &HTTPError{
		Status: e.Status,
		Err: err,
		Message: msg,
	}
}

func (e *HTTPError) Respond(w http.ResponseWriter) {
	if e.Status >= 500 {
		log.Println(e.Status, "Error", e.Message, ":", e.Err)
	}
	w.WriteHeader(e.Status)
	w.Write([]byte(e.Message))
}

func (e *HTTPError) RespondJSON(w http.ResponseWriter) {
	if e.Status >= 500 {
		log.Println(e.Status, "Error", e.Message, ":", e.Err)
	}
	data, _ := json.Marshal(map[string]interface{}{ "status": "error", "code": e.Status, "message": e.Message })
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(e.Status)
	w.Write(data)
}

func (e *HTTPError) IsA(other error) bool {
	he, isa := other.(*HTTPError)
	if !isa {
		return false
	}
	return e.Status == he.Status
}

var BadRequest = &HTTPError{Status: http.StatusBadRequest, Message: "Bad Request"}
var NotFound = &HTTPError{Status: http.StatusNotFound, Message: "Not Found"}
var MethodNotAllowed = &HTTPError{Status: http.StatusMethodNotAllowed, Message: "Method not allowed"}
var ServiceUnavailable = &HTTPError{Status: http.StatusServiceUnavailable, Message: "Service Unavailable"}
var InternalServerError = &HTTPError{Status: http.StatusInternalServerError, Message: "InternalServerError"}
