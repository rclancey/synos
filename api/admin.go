package api

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"github.com/pkg/errors"
	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/httpserver/v2/auth"
	"github.com/rclancey/synos/musicdb"
	"github.com/rclancey/twofactor"
)

func AdminAPI(router H.Router, authmw H.Middleware) {
	router.POST("/user", authmw(H.HandlerFunc(CreateUserHandler)))
	router.GET("/user/:username", authmw(H.HandlerFunc(GetUserHandler)))
	router.PUT("/user/:username", authmw(H.HandlerFunc(EditUserHandler)))
	router.DELETE("/user/:username", authmw(H.HandlerFunc(DeleteUserHandler)))
	router.GET("/users", authmw(H.HandlerFunc(ListUsersHandler)))
}

func readAdmin(req *http.Request) *musicdb.User {
	admin := getUser(req)
	if admin == nil {
		return nil
	}
	err := admin.Reload(db)
	if err != nil {
		return nil
	}
	return admin
}

func CreateUserHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	admin := readAdmin(req)
	if admin == nil || !admin.IsAdmin {
		return nil, H.Forbidden
	}
	tmpuser := &musicdb.User{}
	err := H.ReadJSON(req, tmpuser)
	if err != nil {
		return nil, err
	}
	user := musicdb.NewUser(db, tmpuser.Username)
	if user.HomeDirectory == nil && tmpuser.HomeDirectory != nil {
		user.HomeDirectory = tmpuser.HomeDirectory
	}
	if user.FirstName == nil || user.LastName == nil {
		user.FirstName = tmpuser.FirstName
		user.LastName = tmpuser.LastName
	}
	user.Email = tmpuser.Email
	user.Phone = tmpuser.Phone
	if tmpuser.Avatar != nil {
		user.Avatar = tmpuser.Avatar
	} else if user.Email != nil {
		h := md5.Sum([]byte(strings.ToLower(*user.Email)))
		hash := strings.ToLower(hex.EncodeToString(h[:]))
		u := fmt.Sprintf("https://secure.gravatar.com/avatar/%s", hash)
		c := &http.Client{}
		res, err := c.Get(u+"?d=404")
		if err == nil && res.StatusCode == http.StatusOK {
			user.Avatar = &u
		}
	}
	if tmpuser.Auth != nil && tmpuser.Auth.Password != "" {
		inputs := []string{user.Username}
		if user.FirstName != nil {
			inputs = append(inputs, *user.FirstName)
		}
		if user.LastName != nil {
			inputs = append(inputs, *user.LastName)
		}
		if user.Email != nil {
			inputs = append(inputs, *user.Email)
		}
		if user.Phone != nil {
			inputs = append(inputs, *user.Phone)
		}
		user.Auth, err = twofactor.NewAuth(tmpuser.Auth.Password, inputs...)
		if err != nil {
			return map[string]interface{}{
				"status": "error",
				"error": "bad password",
				"details": err.Error(),
			}, nil
		}
	}
	if tmpuser.IsAdmin {
		user.IsAdmin = true
	}
	err = user.Create()
	if err != nil {
		return nil, err
	}
	return user.Clean(), nil
}

func GetUserHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	admin := readAdmin(req)
	if admin == nil {
		return nil, H.Forbidden
	}
	username := pathVar(req, "username")
	if username == "__myself__" {
		username = admin.Username
	}
	user := &musicdb.User{Username: username}
	err := user.Reload(db)
	if err != nil {
		if errors.Is(err, auth.ErrUnknownUser) {
			return nil, H.NotFound
		}
		return nil, err
	}
	if admin.IsAdmin || admin.Username == user.Username {
		return user, nil
	}
	return user.Clean(), nil
}

func EditUserHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	admin := readAdmin(req)
	if admin == nil {
		return nil, H.Forbidden
	}
	tmpuser := &musicdb.User{}
	err := H.ReadJSON(req, tmpuser)
	if err != nil {
		return nil, err
	}
	username := pathVar(req, "username")
	if !admin.IsAdmin && admin.Username != username {
		return nil, H.Forbidden
	}
	user := &musicdb.User{Username: username}
	err = user.Reload(db)
	if err != nil {
		if errors.Is(err, auth.ErrUnknownUser) {
			return nil, H.NotFound
		}
		return nil, err
	}
	if user.DateModified == nil || tmpuser.DateModified == nil {
		return nil, H.BadRequest
	}
	if *user.DateModified != *tmpuser.DateModified {
		return nil, H.Conflict
	}
	now := musicdb.Now()
	user.FirstName = tmpuser.FirstName
	user.LastName = tmpuser.LastName
	user.Phone = tmpuser.Phone
	user.Avatar = tmpuser.Avatar
	user.AppleID = tmpuser.AppleID
	user.GitHubID = tmpuser.GitHubID
	user.GoogleID = tmpuser.GoogleID
	user.AmazonID = tmpuser.AmazonID
	user.FacebookID = tmpuser.FacebookID
	user.TwitterID = tmpuser.TwitterID
	user.LinkedInID = tmpuser.LinkedInID
	user.SlackID = tmpuser.SlackID
	user.BitBucketID = tmpuser.BitBucketID
	user.DateModified = &now
	if admin.IsAdmin {
		user.HomeDirectory = tmpuser.HomeDirectory
		user.Email = tmpuser.Email
		if admin.Username != user.Username {
			// we don't want an admin accidentally
			// removing their own admin privileges
			user.IsAdmin = tmpuser.IsAdmin
		}
		if tmpuser.Auth != nil && tmpuser.Auth.Password != "" {
			if user.Auth == nil {
				user.Auth, err = twofactor.NewAuth(tmpuser.Auth.Password)
				if err != nil {
					return nil, H.BadRequest.Wrap(err, "bad password")
				}
			} else if user.Auth.Password != tmpuser.Auth.Password {
				err = user.Auth.SetPassword(tmpuser.Auth.Password)
				if err != nil {
					return nil, H.BadRequest.Wrap(err, "bad password")
				}
			}
		}
	}
	err = user.Update()
	if err != nil {
		return nil, err
	}
	return user, nil
}

func DeleteUserHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	admin := readAdmin(req)
	if admin == nil {
		return nil, H.Forbidden
	}
	username := pathVar(req, "username")
	if !admin.IsAdmin && admin.Username != username {
		return nil, H.Forbidden
	}
	user := &musicdb.User{Username: username}
	err := user.Reload(db)
	if err != nil {
		if errors.Is(err, auth.ErrUnknownUser) {
			return nil, H.NotFound
		}
		return nil, err
	}
	if user.Active {
		return user, nil
	}
	user.Active = false
	err = user.Update()
	if err != nil {
		return nil, err
	}
	return user, nil
}

func ListUsersHandler(w http.ResponseWriter, req *http.Request) (interface{}, error) {
	users, err := db.ListUsers()
	if err != nil {
		return nil, err
	}
	for i, user := range users {
		users[i] = user.Clean()
	}
	return users, nil
}
