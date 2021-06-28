package api

import (
	H "github.com/rclancey/httpserver"
)

var DatabaseError = H.InternalServerError.New("Database Error")
var FilesystemError = H.InternalServerError.New("Filesystem Error")
var SonosError = H.InternalServerError.New("Error communicating with Sonos")
var SonosUnavailableError = H.ServiceUnavailable.New("Sonos not available")
var JSONStatusOK = map[string]string{"status": "OK"}
