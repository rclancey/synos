package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"itunes"
)

func loadPids(fn string) []itunes.PersistentID {
	f, _ := os.Open(fn)
	text, _ := ioutil.ReadAll(f)
	lines := strings.Split(string(text), "\n")
	if lines[len(lines) - 1] == "" {
		lines = lines[:len(lines)-1]
	}
	pids := make([]itunes.PersistentID, len(lines))
	for i, line := range lines {
		var pid itunes.PersistentID
		if (&pid).DecodeString(line) == nil {
			pids[i] = pid
		}
	}
	return pids
}

func main() {
	base := loadPids(os.Args[1])
	v1 := loadPids(os.Args[2])
	v2 := loadPids(os.Args[3])
	res, ok := itunes.ThreeWayMerge(base, v1, v2)
	if !ok {
		fmt.Println("BAD MERGE")
	}
	for _, pid := range res {
		fmt.Println(pid)
	}
}
