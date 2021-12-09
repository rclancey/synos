package api

import (
	"embed"
	"io/ioutil"
	"strings"
)

//go:embed version
var versionFs embed.FS

var SynosVersion string

func init() {
	SynosVersion = "v0.0.0"
	f, err := versionFs.Open("version/version.txt")
	if err == nil {
		defer f.Close()
		data, err := ioutil.ReadAll(f)
		if err == nil {
			SynosVersion = strings.TrimSpace(string(data))
		}
	}
}
