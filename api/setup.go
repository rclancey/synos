package api

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"syscall"

	H "github.com/rclancey/httpserver/v2"
	"github.com/rclancey/authenticator"
	"github.com/rclancey/authenticator/ssh"
	"github.com/rclancey/httpserver/v2/auth"
)

type SystemSource struct {}

type SystemUser struct {
	*user.User
}

func (src *SystemSource) GetUser(username string) (auth.AuthUser, error) {
	u, err := user.Lookup(username)
	if err != nil {
		return nil, err
	}
	return &SystemUser{u}, nil
}

func (src *SystemSource) GetUserByEmail(addr string) (auth.AuthUser, error) {
	return nil, errors.New("not implemented")
}

func (u *SystemUser) GetUsername() string {
	return u.Username
}

func (u *SystemUser) GetUserID() int64 {
	v, _ := strconv.Atoi(u.Uid)
	return int64(v)
}

func (u *SystemUser) GetFullName() string {
	return u.Name
}

func (u *SystemUser) GetAuth() (authenticator.Authenticator, error) {
	return sshauth.NewSSHAuthenticator(u.Username), nil
}

func (u *SystemUser) SetAuth(auther authenticator.Authenticator) error {
	return nil
}

func MakeStatusHandler(cause error) http.Handler {
	errs := []string{}
	err := cause
	for err != nil {
		errs = append(errs, err.Error())
		err = errors.Unwrap(err)
	}
	h := func(w http.ResponseWriter, r *http.Request) (interface{}, error) {
		return errs, nil
	}
	return H.HandlerFunc(h)
}

func SetupAPI(srv *H.Server, cause error) error {
	authen, err := auth.NewAuthenticator(cfg.Auth, &SystemSource{})
	if err != nil {
		return err
	}
	authmw := authen.MakeMiddleware()
	router := srv.Prefix("/api/setup")
	authen.LoginAPI(router)
	router.GET("/status", MakeStatusHandler(cause))
	router.GET("/config", authmw(H.HandlerFunc(ReadConfigHandler)))
	router.POST("/config", authmw(H.HandlerFunc(SaveConfigHandler)))
	router.POST("/restart", authmw(H.HandlerFunc(RestartServerHandler)))
	return nil
}

type AdminConfig struct {
	Username string `json:"username"`
	Name string `json:"name"`
	HomeDir string `json:"home_directory"`
	WorkDir string `json:"working_directory"`
	Program string `json:"program"`
	ConfigFile string `json:"filename"`
	Default *SynosConfig `json:"default_config"`
	Raw *SynosConfig `json:"raw_config"`
	Expanded *SynosConfig `json:"expanded_config"`
}

func ReadConfigHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	u, err := user.Current()
	if err != nil {
		return nil, err
	}
	cwd, err := os.Getwd()
	if err != nil {
		return nil, err
	}
	out := &AdminConfig{
		Username: u.Username,
		Name: u.Name,
		HomeDir: u.HomeDir,
		WorkDir: cwd,
		Program: os.Args[0],
		ConfigFile: cfg.ConfigFile,
		Default: DefaultSynosConfig(),
		Raw: nil,
		Expanded: cfg,
	}
	fn := cfg.ConfigFile
	if fn != "" {
		f, err := os.Open(fn)
		if err == nil {
			defer f.Close()
			data, err := ioutil.ReadAll(f)
			if err == nil {
				rawcfg := &SynosConfig{}
				err = json.Unmarshal(data, rawcfg)
				if err == nil {
					out.Raw = rawcfg
				}
			}
		}
	}
	return out, nil
}

func SaveConfigHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	raw := &SynosConfig{}
	err := H.ReadJSON(r, raw)
	if err != nil {
		return nil, err
	}
	fn := cfg.ConfigFile + ".tmp"
	f, err := os.Create(fn)
	if err != nil {
		log.Println("error creating config file:", err)
		return nil, FilesystemError
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	err = enc.Encode(raw)
	if err != nil {
		f.Close()
		log.Println("error writing config file:", err)
		return nil, FilesystemError
	}
	err = f.Close()
	if err != nil {
		log.Println("error writing config file:", err)
		return nil, FilesystemError
	}
	outfn := filepath.Join(raw.ServerRoot, "config.json")
	st, err := os.Stat(outfn)
	if err == nil {
		savefn := filepath.Join(raw.ServerRoot, "config.json." + st.ModTime().Format("20060102T150405"))
		err = os.Rename(outfn, savefn)
		if err != nil {
			log.Println("error saving backup of existing config file:", err)
			return nil, FilesystemError
		}
	}
	err = os.Rename(fn, outfn)
	if err != nil {
		log.Println("error moving config file into place:", err)
		return nil, FilesystemError
	}
	return ReadConfigHandler(w, r)
}

func RestartServerHandler(w http.ResponseWriter, r *http.Request) (interface{}, error) {
	syscall.Kill(os.Getpid(), syscall.SIGHUP)
	return JSONStatusOK, nil
}
