package api

import (
	"errors"

	H "github.com/rclancey/httpserver/v2"
)

var DatabaseError = H.InternalServerError.New("Database Error")
var FilesystemError = H.InternalServerError.New("Filesystem Error")
var SonosError = H.InternalServerError.New("Error communicating with Sonos")
var SonosUnavailableError = H.ServiceUnavailable.New("Sonos not available")
var JSONStatusOK = map[string]string{"status": "OK"}

// startup errors
var ErrInvalidConfiguration = errors.New("Invalid configuration")
var ErrNoConfiguration      = errors.New("No configuration found")
var ErrLoggingError         = errors.New("Error starting logger")
var ErrInstallerError       = errors.New("Error installing/upgrading database")
var ErrDatabaseError        = errors.New("Error connecting to database")
var ErrSMTPClientError      = errors.New("Error configuring SMTP client")
var ErrAuthenticatorError   = errors.New("Error configuring authentication schemes")
