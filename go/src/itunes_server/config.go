package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/akamensky/argparse"

	"itunes"
)

type SynosConfig struct {
	SSL struct {
		CertFile string `json:"cert_file"`
		KeyFile string `json:"key_file"`
	} `json:"ssl"`
	Port int `json:"port"`
	Netmask string `json:"netmask"`
	ItunesLibrary string `json:"itunes_library"`
	MediaFolder string `json:"media_folder"`
	MediaPath []string `json:"media_path"`
	CoverArt []string `json:"cover_art"`
	filename string
	ip net.IP
	iface string
}

func (cfg *SynosConfig) FileFinder() *itunes.FileFinder {
	return itunes.NewFileFinder(cfg.MediaFolder, cfg.MediaPath, cfg.MediaPath)
}

func (cfg *SynosConfig) FindLibrary() (string, error) {
	return cfg.FileFinder().FindFile(cfg.ItunesLibrary)
}

func (cfg *SynosConfig) LoadFromFile(fn string) error {
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
	xcfg := &SynosConfig{}
	err = json.Unmarshal(data, xcfg)
	if err != nil {
		return err
	}
	cfg.SSL = xcfg.SSL
	cfg.Port = xcfg.Port
	cfg.Netmask = xcfg.Netmask
	cfg.ItunesLibrary = xcfg.ItunesLibrary
	cfg.MediaFolder = xcfg.MediaFolder
	cfg.MediaPath = xcfg.MediaPath
	cfg.CoverArt = xcfg.CoverArt
	cfg.filename = fn
	return nil
}

func (cfg *SynosConfig) UseSSL() bool {
	return cfg.SSL.CertFile != "" && cfg.SSL.KeyFile != ""
}

func (cfg *SynosConfig) Proto() string {
	if cfg.UseSSL() {
		return "https"
	}
	return "http"
}

func (cfg *SynosConfig) IP() string {
	return cfg.ip.String()
}

func (cfg *SynosConfig) URLPort() string {
	if cfg.UseSSL() {
		if cfg.Port == 443 {
			return ""
		}
	} else if cfg.Port == 80 {
		return ""
	}
	return fmt.Sprintf(":%d", cfg.Port)
}

func (cfg *SynosConfig) Host() string {
	return cfg.IP() + cfg.URLPort()
}

func (cfg *SynosConfig) NetworkInterface() string {
	return cfg.iface
}

func (cfg *SynosConfig) getNetwork() *net.IPNet {
	dflt := &net.IPNet{
		IP: net.IPv4(0, 0, 0, 0),
		Mask: net.CIDRMask(0, 32),
	}
	parts := strings.Split(cfg.Netmask, "/")
	if len(parts) != 2 {
		return dflt
	}
	ip := net.ParseIP(parts[0])
	maskbits, err := strconv.Atoi(parts[1])
	if err != nil {
		return dflt
	}
	mask := net.CIDRMask(maskbits, 32)
	return &net.IPNet{
		IP: ip,
		Mask: mask,
	}
}

func (cfg *SynosConfig) ConfigureNetwork() error {
	network := cfg.getNetwork()
	ifaces, err := net.Interfaces()
	if err != nil {
		return err
	}
	for _, iface := range ifaces {
		log.Println("examining interface", iface.Name)
		addrs, err := iface.Addrs()
		if err != nil {
			return err
		}
		for _, addr := range addrs {
			ips := strings.Split(addr.String(), "/")[0]
			ip := net.ParseIP(ips)
			log.Println("checking ip", addr.String(), ip.String())
			if network.Contains(ip) {
				cfg.iface = iface.Name
				cfg.ip = ip
				return nil
			}
		}
	}
	return fmt.Errorf("no interface is bound to network %s", cfg.Netmask)
}

func (cfg *SynosConfig) GetRootURL() *url.URL {
	return &url.URL{
		Scheme: cfg.Proto(),
		Host: cfg.Host(),
		Path: "/",
	}
}

func Configure() (*SynosConfig, error) {
	home := os.Getenv("HOME")
	parser := argparse.NewParser("synos_server", "Synos media API server")
	cfgfn := parser.String("c", "config", &argparse.Options{Required: false, Default: filepath.Join(home, ".synos.cfg"), Help: "Server config file"})
	ssl_cert := parser.String("s", "ssl-cert", &argparse.Options{Required: false, Help: "Path to SSL cert file"})
	ssl_key := parser.String("k", "ssl-key", &argparse.Options{Required: false, Help: "Path to SSL key file"})
	port := parser.Int("p", "port", &argparse.Options{Required: false, Help: "Network port to listen on"})
	netmask := parser.String("n", "network", &argparse.Options{Required: false, Help: "Network to bind to"})
	mediaLibFolder := parser.String("f", "folder", &argparse.Options{Required: false, Help: "Common root music library folder"})
	mediaPaths := parser.List("p", "path", &argparse.Options{Required: false, Help: "Search path for music libraries"})
	coverArt := parser.List("a", "cover-art", &argparse.Options{Required: false, Help: "Filenames for cover art"})
	libFn := parser.String("l", "library", &argparse.Options{Required: false, Help: "iTunes library filename"})
	err := parser.Parse(os.Args)
	if err != nil {
		return nil, err
	}
	cfg := &SynosConfig{}
	if cfgfn != nil && *cfgfn != "" {
		err = cfg.LoadFromFile(*cfgfn)
		if err != nil && !os.IsNotExist(err) {
			return nil, err
		}
	}
	if ssl_cert != nil && *ssl_cert != "" {
		cfg.SSL.CertFile = *ssl_cert
	}
	if ssl_key != nil && *ssl_key != "" {
		cfg.SSL.KeyFile = *ssl_key
	}
	if port != nil && *port != 0 {
		cfg.Port = *port
	}
	if netmask != nil && *netmask != "" {
		cfg.Netmask = *netmask
	}
	if mediaLibFolder != nil && *mediaLibFolder != "" {
		cfg.MediaFolder = *mediaLibFolder
	}
	if mediaPaths != nil && len(*mediaPaths) > 0 {
		cfg.MediaPath = append(cfg.MediaPath, *mediaPaths...)
	}
	if coverArt != nil && len(*coverArt) > 0 {
		cfg.CoverArt = *coverArt
	}
	if libFn != nil && *libFn != "" {
		cfg.ItunesLibrary = *libFn
	}
	for i, v := range cfg.MediaPath {
		if strings.Contains(v, "$HOME") {
			cfg.MediaPath[i] = strings.Replace(v, "$HOME", home, -1)
		}
	}
	if cfg.Port == 0 {
		if cfg.UseSSL() {
			cfg.Port = 10443
		} else {
			cfg.Port = 10080
		}
	}
	if cfg.CoverArt == nil || len(cfg.CoverArt) == 0 {
		cfg.CoverArt = []string{
			"cover.jpg",
			"cover.png",
		}
	}
	if cfg.ItunesLibrary == "" {
		cfg.ItunesLibrary = "iTunes Music Library.xml"
	}
	if cfg.MediaFolder == "" {
		cfg.MediaFolder = "Music/iTunes"
	}
	if cfg.MediaPath == nil || len(cfg.MediaPath) == 0 {
		cfg.MediaPath = []string{home}
	}
	err = cfg.ConfigureNetwork()
	if err != nil {
		data, _ := json.MarshalIndent(cfg, "", "  ")
		log.Println(string(data))
		return nil, err
	}
	return cfg, nil
}

