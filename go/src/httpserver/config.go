package httpserver

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	//"github.com/alexflint/go-arg"
	//"github.com/akamensky/argparse"

	"argparse"
	"logging"
)

type SSLConfig struct {
	Port     int    `json:"port"     arg:"port"`
	CertFile string `json:"cert"     arg:"cert"`
	KeyFile  string `json:"key"      arg:"key"`
	Disabled bool   `json:"disabled" arg:"disable"`
}

func (cfg *SSLConfig) CheckCert(serverRoot string) error {
	fn, err := makeRootAbs(serverRoot, cfg.CertFile)
	if err != nil {
		return err
	}
	err = checkReadableFile(fn)
	if err != nil {
		return err
	}
	cfg.CertFile = fn
	return nil
}

func (cfg *SSLConfig) CheckKey(serverRoot string) error {
	fn, err := makeRootAbs(serverRoot, cfg.KeyFile)
	if err != nil {
		return err
	}
	err = checkReadableFile(fn)
	if err != nil {
		return err
	}
	cfg.KeyFile = fn
	return nil
}

func (cfg SSLConfig) Enabled() bool {
	return !cfg.Disabled && cfg.Port != 0 && cfg.CertFile != "" && cfg.KeyFile != ""
}

func (cfg *SSLConfig) Init(serverRoot string) error {
	err := cfg.CheckCert(serverRoot)
	if err != nil {
		return err
	}
	err = cfg.CheckKey(serverRoot)
	if err != nil {
		return err
	}
	return nil
}

type BindConfig struct {
	ExternalHostname string    `json:"hostname" arg:"hostname"`
	Port             int       `json:"port"     arg:"port"`
	SSL              SSLConfig `json:"ssl"      arg:"ssl"`
}

func (cfg *BindConfig) Init(serverRoot string) error {
	err := cfg.SSL.Init(serverRoot)
	if err != nil {
		return err
	}
	return nil
}

func (cfg BindConfig) Proto(ssl bool) string {
	if ssl && cfg.SSL.Enabled() {
		return "https"
	}
	return "http"
}

func (cfg BindConfig) Host(netcfg NetCfg, ssl bool) string {
	var host string
	if netcfg != nil {
		host = netcfg.GetIP().String()
	} else if cfg.ExternalHostname != "" {
		host = cfg.ExternalHostname
	} else {
		host = "localhost"
	}
	if ssl && cfg.SSL.Enabled() {
		if cfg.SSL.Port == 443 {
			return host
		}
		return host + fmt.Sprintf(":%d", cfg.SSL.Port)
	}
	if cfg.Port == 80 {
		return host
	}
	return host + fmt.Sprintf(":%d", cfg.Port)
}

func (cfg BindConfig) RootURL(netcfg NetCfg, ssl bool) *url.URL {
	return &url.URL{
		Scheme: cfg.Proto(ssl),
		Host: cfg.Host(netcfg, ssl),
		Path: "/",
	}
}

type LogConfig struct {
	Directory    string           `json:"directory"     arg:"dir"`
	AccessLog    string           `json:"access"        arg:"access"`
	ErrorLog     string           `json:"error"         arg:"error"`
	RotatePeriod int              `json:"rotate_period" arg:"rotate-period"`
	RetainCount  int              `json:"retain"        arg:"retain"`
	LogLevel     logging.LogLevel `json:"level"         arg:"level"`
	errlog       *logging.Logger
	acclog       *logging.AccessLogger
}

func (cfg *LogConfig) Init(serverRoot string) error {
	dn, err := makeRootAbs(serverRoot, cfg.Directory)
	if err != nil {
		return err
	}
	err = checkWritableDir(dn)
	if err != nil {
		return err
	}
	cfg.Directory = dn
	fn, err := makeRootAbs(cfg.Directory, cfg.AccessLog)
	if err != nil {
		return err
	}
	cfg.AccessLog = fn
	fn, err = makeRootAbs(cfg.Directory, cfg.ErrorLog)
	if err != nil {
		return err
	}
	cfg.ErrorLog = fn
	return nil
}

func (cfg *LogConfig) ErrorLogger() (*logging.Logger, error) {
	if cfg.errlog == nil {
		errlog, err := logging.NewLogger(cfg.ErrorLog, cfg.LogLevel, time.Duration(cfg.RotatePeriod) * time.Minute, cfg.RetainCount)
		if err != nil {
			return nil, err
		}
		cfg.errlog = errlog
		go cfg.errlog.Watch()
	}
	return cfg.errlog, nil
}

func (cfg *LogConfig) AccessLogger(server http.Handler) (*logging.AccessLogger, error) {
	if cfg.acclog != nil {
		cfg.acclog.Close()
		cfg.acclog = nil
	}
	acclog, err := logging.NewAccessLogger(server, cfg.AccessLog, logging.INFO, time.Duration(cfg.RotatePeriod) * time.Minute, cfg.RetainCount)
	if err != nil {
		return nil, err
	}
	cfg.acclog = acclog
	go cfg.acclog.Watch()
	return cfg.acclog, nil
}

type ServerConfig struct {
	ConfigFile          string         `json:"-"               arg:"--config,-c"`
	ServerRoot          string         `json:"server_root"     arg:"--server-root"`
	DocumentRoot        string         `json:"document_root"   arg:"--docroot"`
	CacheDirectory      string         `json:"cache_directory" arg:"--cache-dir"`
	PidFile             string         `json:"pidfile"         arg:"--pidfile"`
	Bind                BindConfig     `json:"bind"            arg:"--bind"`
	Logging             LogConfig      `json:"log"             arg:"--log"`
	Auth                AuthConfig     `json:"auth"            arg:"--auth"`
}

func (cfg *ServerConfig) Abs(fn string) (string, error) {
	return makeRootAbs(cfg.ServerRoot, fn)
}

func (cfg *ServerConfig) ReadableFile(fn string) error {
	return checkReadableFile(fn)
}

func (cfg *ServerConfig) WritableDir(dn string) error {
	return checkWritableDir(dn)
}

func (cfg *ServerConfig) Init() error {
	dn, err := filepath.Abs(filepath.Clean(EnvEval(cfg.ServerRoot)))
	if err != nil {
		return err
	}
	cfg.ServerRoot = dn
	dn, err = cfg.Abs(cfg.DocumentRoot)
	if err != nil {
		return err
	}
	cfg.DocumentRoot = dn
	dn, err = cfg.Abs(cfg.CacheDirectory)
	if err != nil {
		return err
	}
	err = cfg.WritableDir(dn)
	if err != nil {
		return err
	}
	cfg.CacheDirectory = dn
	fn, err := cfg.Abs(cfg.PidFile)
	if err != nil {
		return err
	}
	dn = filepath.Dir(fn)
	err = cfg.WritableDir(dn)
	if err != nil {
		return err
	}
	cfg.PidFile = fn
	err = cfg.Bind.Init(cfg.ServerRoot)
	if err != nil {
		return err
	}
	err = cfg.Logging.Init(cfg.ServerRoot)
	if err != nil {
		return err
	}
	err = cfg.Auth.Init(cfg.ServerRoot)
	if err != nil {
		return err
	}
	return nil
}

func (cfg *ServerConfig) CheckPidfile() error {
	f, err := os.Open(cfg.PidFile)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer f.Close()
	data := make([]byte, 256)
	n, err := f.Read(data)
	if err != nil {
		return err
	}
	if n == 0 {
		return nil
	}
	pid, err := strconv.ParseInt(strings.TrimSpace(string(data[:n])), 10, 32)
	if err != nil {
		return err
	}
	proc, err := os.FindProcess(int(pid))
	if err != nil {
		return err
	}
	err = proc.Signal(syscall.Signal(0))
	if err == nil {
		return fmt.Errorf("%s already running at PID %d", os.Args[0], pid)
	}
	return nil
}

func (cfg *ServerConfig) CheckPorts() error {
	if cfg.Bind.Port != 0 {
		err := cfg.checkPort(cfg.Bind.Port)
		if err != nil {
			return err
		}
	}
	if cfg.Bind.SSL.Enabled() {
		err := cfg.checkPort(cfg.Bind.SSL.Port)
		if err != nil {
			return err
		}
	}
	return nil
}

func (cfg *ServerConfig) checkPort(port int) error {
	ln, err := net.Listen("tcp", ":" + strconv.Itoa(port))
	if err != nil {
		return fmt.Errorf("port %d already in use", port)
	}
	ln.Close()
	return nil
}

func (cfg *ServerConfig) LoadFromFile(fn string) error {
	var f io.ReadCloser
	var err error
	if fn == "-" {
		f = os.Stdin
	} else {
		f, err = os.Open(fn)
		if err != nil {
			return err
		}
	}
	defer f.Close()
	data, err := ioutil.ReadAll(f)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, cfg)
}

func DefaultServerConfig() *ServerConfig {
	return &ServerConfig{
		ConfigFile: "config.json",
		ServerRoot: ".",
		DocumentRoot: "htdocs",
		Logging: LogConfig{
			Directory: "var/log",
			AccessLog: "access.log",
			ErrorLog: "error.log",
			RotatePeriod: 24 * 60,
			RetainCount: 7,
			LogLevel: logging.INFO,
		},
		Auth: AuthConfig{
			PasswordFile: ".htpasswd",
			AuthKey: "",
			TTL: 30 * 24 * 60 * 60,
		},
		CacheDirectory: "var/cache",
		PidFile: "var/synos.pid",
		Bind: BindConfig{
			Port: 8080,
			SSL: SSLConfig{
				Port: 8043,
			},
		},
	}
}

func Configure() (*ServerConfig, error) {
	var err error
	cfg := DefaultServerConfig()
	err = argparse.ParseArgs(cfg)
	if err != nil {
		return nil, err
	}
	cfg.ServerRoot, err = filepath.Abs(filepath.Clean(EnvEval(cfg.ServerRoot)))
	if err != nil {
		return nil, err
	}
	cfg.ConfigFile, err = makeRootAbs(cfg.ServerRoot, cfg.ConfigFile)
	if err != nil {
		return nil, err
	}
	_, err = os.Stat(cfg.ConfigFile)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	} else {
		err = cfg.LoadFromFile(cfg.ConfigFile)
		if err != nil {
			return nil, err
		}
		err = argparse.ParseArgs(cfg)
		if err != nil {
			return nil, err
		}
	}
	err = cfg.Init()
	if err != nil {
		return nil, err
	}
	data, _ := json.MarshalIndent(cfg, "", "  ")
	log.Println(string(data))
	return cfg, nil
}
