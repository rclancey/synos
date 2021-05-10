package main

import (
	"net/http"
	//"path"
	"strings"

	H "github.com/rclancey/httpserver"
	"musicdb"
)

/*
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
	return musicdb.PersistentID(0), H.BadRequest.Wrap(nil, "no id in url")
}
*/

func pathVar(r *http.Request, name string) string {
	return H.ContextRequestVars(r.Context())[name]
}

func getPathId(r *http.Request) (musicdb.PersistentID, error) {
	return getPathIdByName(r, "id")
}

func getPathIdByName(r *http.Request, name string) (musicdb.PersistentID, error) {
	v := strings.Split(pathVar(r, name), ".")[0]
	if v == "" {
		return musicdb.PersistentID(0), H.BadRequest.Wrap(nil, "no id in url")
	}
	pid := new(musicdb.PersistentID)
	err := pid.Decode(v)
	if err != nil {
		return musicdb.PersistentID(0), H.BadRequest.Wrap(nil, "not a valid persistent id")
	}
	return *pid, nil
}

