package api

import (
	"context"
	"encoding/base64"
	"io"
	"math/rand"
	"net/http"
	hprof "net/http/pprof"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"runtime/pprof"

	"github.com/rclancey/htpasswd"
	H "github.com/rclancey/httpserver"
	"github.com/rclancey/httpserver/auth"
)

func randStr(n int) string {
	data := make([]byte, n)
	rand.Read(data)
	return base64.StdEncoding.EncodeToString(data)[:n]
}

func LoginAPI(router H.Router, authmw Middleware) {
	router.POST("/login", H.HandlerFunc(authmw(LoginHandler)))
	router.GET("/status", H.HandlerFunc(StatusHandler))
	router.GET("/rawprof", H.HandlerFunc(RawPProfHandler))
	router.GET("/pprof", H.HandlerFunc(PProfHandler))
	router.GET("/hprof", http.HandlerFunc(hprof.Profile))
}

func LoginHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	user := GetAuthUser(r)
	if user == nil {
		return nil, H.Unauthorized
	}
	return user, nil
}

func StatusHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	mem := &runtime.MemStats{}
	runtime.ReadMemStats(mem)
	return mem, nil
}

func RawPProfHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	w.Header().Set("Content-Type", "application/octet-stream")
	w.WriteHeader(http.StatusOK)
	pprof.Lookup("heap").WriteTo(w, 0)
	return nil, nil
}

func PProfHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	name := randStr(8)
	fn := filepath.Join(os.TempDir(), name + ".pprof")
	pw, err := os.Create(fn)
	if err != nil {
		return nil, err
	}
	err = pprof.Lookup("heap").WriteTo(pw, 0)
	if err != nil {
		pw.Close()
		return nil, err
	}
	err = pw.Close()
	if err != nil {
		return nil, err
	}
	svgfn := filepath.Join(os.TempDir(), name + ".svg")
	cmd := exec.Command("go", "tool", "pprof", "-svg", "-output", svgfn, fn)
	err = cmd.Run()
	os.Remove(fn)
	if err != nil {
		os.Remove(svgfn)
		return nil, err
	}
	f, err := os.Open(svgfn)
	if err != nil {
		return nil, err
	}
	w.Header().Set("Content-Type", "image/svg+xml")
	w.WriteHeader(http.StatusOK)
	io.Copy(w, f)
	f.Close()
	return nil, nil
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
				user = cfg.ReadHeader(r, "X-API-Auth")
			}
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
