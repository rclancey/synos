package api

import (
	_ "embed"
	"strings"
)

//go:embed version.txt
var SynosVersion string

func init() {
	SynosVersion = strings.TrimSpace(SynosVersion)
}
