package musicdb

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var aAnThe = regexp.MustCompile(`^(a|an|the) `)
var nonAlpha = regexp.MustCompile(`[^a-z0-9]+`)
var spaces = regexp.MustCompile(`\s+`)
var nums = regexp.MustCompile(` (\d+)`)
var numCan = regexp.MustCompile(`^(\d+[,\d]*)`)

func numReplFunc(inp string) string {
	s := strings.Replace(inp, ",", "", -1)
	iv, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return inp
	}
	return fmt.Sprintf("~%06d", iv)
}

func MakeSort(v string) string {
	if v == "" {
		return ""
	}
	s := strings.ToLower(v)
	s = numCan.ReplaceAllStringFunc(s, numReplFunc)
	s = nonAlpha.ReplaceAllString(s, " ")
	s = aAnThe.ReplaceAllString(s, " ")
	s = nums.ReplaceAllString(s, "~$1")
	s = spaces.ReplaceAllString(s, " ")
	s = strings.TrimSuffix(s, "~")
	s = strings.TrimSpace(s)
	//s = spaces.ReplaceAllString(s, " ")
	//s = aAnThe.ReplaceAllString(s, "")
	//s = strings.TrimSpace(s)
	return s
}

func MakeSortArtist(v string) string {
	s := MakeSort(v)
	if strings.Contains(s, " feat ") {
		s = strings.Split(s, " feat ")[0]
	} else if strings.Contains(s, " featuring ") {
		s = strings.Split(s, " featuring ")[0]
	} else if strings.Contains(s, " with ") {
		s = strings.Split(s, " with ")[0]
	}
	s = strings.TrimSpace(s)
	return s
}

