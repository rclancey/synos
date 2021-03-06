package api

import (
	"log"
	"net/http"
	//"path"
	"strings"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/synos/musicdb"
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

func getUser(r *http.Request) *musicdb.User {
	auser := auth.UserFromRequest(r)
	if auser == nil {
		log.Println("no user in request")
		return nil
	}
	idu, ok := auser.(auth.IntIDUser)
	if !ok {
		log.Printf("user is not auth.IntIDUser: %T", auser)
		return nil
	}
	user := &musicdb.User{
		PersistentID: musicdb.PersistentID(idu.GetUserID()),
		Username: auser.GetUsername(),
	}
	flnu, ok := auser.(auth.FirstLastNameUser)
	if ok {
		user.FirstName = stringp(flnu.GetFirstName())
		user.LastName = stringp(flnu.GetLastName())
	}
	eu, ok := auser.(auth.EmailUser)
	if ok {
		user.Email = stringp(eu.GetEmailAddress())
	}
	pu, ok := auser.(auth.PhoneUser)
	if ok {
		user.Phone = stringp(pu.GetPhoneNumber())
	}
	return user
}
