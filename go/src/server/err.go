package main

import (
	"net/http"
	"httpserver"
)

var DatabaseError = &httpserver.HTTPError{
	Status: http.StatusInternalServerError,
	Message: "Database Error",
}

var FilesystemError = &httpserver.HTTPError{
	Status: http.StatusInternalServerError,
	Message: "Filesystem Error",
}

var SonosError = &httpserver.HTTPError{
	Status: http.StatusInternalServerError,
	Message: "Error communicating with Sonos",
}

var SonosUnavailableError = &httpserver.HTTPError{
	Status: http.StatusServiceUnavailable,
	Message: "Sonos not available",
}

var JSONStatusOK = map[string]string{"status": "OK"}
