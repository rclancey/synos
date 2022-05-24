package api

import (
	"net/http"
	"strconv"

	H "github.com/rclancey/httpserver/v2"
)

var SynosBuildDate = ""
var SynosCommit = ""
var SynosBranch = ""
var SynosVersion = ""

func VersionAPI(router H.Router, authmw H.Middleware) {
	router.GET("/version", H.HandlerFunc(GetVersionInfo))
}

type VersionInfo struct {
	BuildDateMs *int64 `json:"build_date,omitempty"`
	Hash        string `json:"hash,omitempty"`
	Branch      string `json:"branch,omitempty"`
	Version     string `json:"version,omitempty"`
}

func GetVersionInfo(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	v := &VersionInfo{
		Hash:    SynosCommit,
		Branch:  SynosBranch,
		Version: SynosVersion,
	}
	s, err := strconv.Atoi(SynosBuildDate)
	if err == nil {
		t := int64(s) * 1000
		v.BuildDateMs = &t
	}
	return v, nil
}
