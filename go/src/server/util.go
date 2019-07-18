package main

import (
	"net/http"
	"path"
	"strings"

	H "httpserver"
	"musicdb"
)

func getPathId(req *http.Request) (musicdb.PersistentID, error) {
	dn := req.URL.Path
	var id string
	for dn != "/" {
		dn, id = path.Split(path.Clean(dn))
		if strings.Contains(id, ".") {
			parts := strings.Split(id, ".")
			id = strings.Join(parts[:len(parts)-1], ".")
		}
		pid := new(musicdb.PersistentID)
		err := pid.Decode(id)
		if err == nil {
			return *pid, nil
		}
	}
	return musicdb.PersistentID(0), H.BadRequest.Raise(nil, "no id in url")
}

