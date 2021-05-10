package main

import (
	"context"
	"net/http"

	"github.com/rclancey/htpasswd"
	H "github.com/rclancey/httpserver"
	"github.com/rclancey/httpserver/auth"
)

func LoginAPI(router H.Router, authmw Middleware) {
	router.POST("/login", H.HandlerFunc(authmw(LoginHandler)))
}

func LoginHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	user := GetAuthUser(r)
	if user == nil {
		return nil, H.Unauthorized
	}
	return user, nil
}

type authKey string

func GetAuthUser(r *http.Request) *auth.User {
	user, isa := r.Context().Value(authKey("authUser")).(*auth.User)
	if isa {
		return user
	}
	return nil
}

func AuthenticationMiddleware(cfg *H.AuthConfig) Middleware {
	htp := htpasswd.NewHTPasswd(cfg.PasswordFile)
	return func(handler hf) hf {
		f := func(w http.ResponseWriter, r *http.Request) (interface{}, error) {
			var err error
			user := cfg.ReadCookie(r)
			if user == nil {
				username, password, ok := r.BasicAuth()
				if ok {
					user, err = htp.Authenticate(username, password)
					if err != nil {
						return nil, H.InternalServerError.Wrap(err, "")
					}
				}
			}
			if user == nil {
				return nil, H.Unauthorized
			}
			if user.Provider != "htpasswd" {
				user, err = htp.GetUserByEmail(user.Email)
				if err != nil {
					return nil, H.InternalServerError.Wrap(err, "")
				}
			}
			if user == nil {
				return nil, H.Unauthorized
			}
			cfg.SetCookie(w, user)
			ctx := context.WithValue(r.Context(), authKey("authUser"), user)
			r = r.Clone(ctx)
			return handler(w, r)
		}
		return hf(f)
	}
}
