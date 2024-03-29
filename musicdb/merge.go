package musicdb

import (
	"log"
	"strings"

	"github.com/rclancey/itunes/persistentId"
	"github.com/sergi/go-diff/diffmatchpatch"
)

func pidsToText(pids []pid.PersistentID) string {
	lines := make([]string, len(pids))
	for i, p := range pids {
		lines[i] = p.String()
	}
	return strings.Join(lines, "\n")
}

func ThreeWayMerge(base, delta_one, delta_two []pid.PersistentID) (out []pid.PersistentID, ok bool) {
	defer func() {
		if r := recover(); r != nil {
			log.Println("recovering from", r)
			out = delta_one
			ok = false
		}
	}()
	base_s := pidsToText(base)
	delta_one_s := pidsToText(delta_one)
	delta_two_s := pidsToText(delta_two)
	dmp := diffmatchpatch.New()
	patches := dmp.PatchMake(base_s, delta_one_s)
	res, applied := dmp.PatchApply(patches, delta_two_s)
	for _, app := range applied {
		if !app {
			out = delta_two
			ok = false
			return
		}
	}
	lines := strings.Split(res, "\n")
	pids := make([]pid.PersistentID, len(lines))
	for i, line := range lines {
		var p pid.PersistentID
		if (&p).Decode(line) == nil {
			pids[i] = p
		}
	}
	out = pids
	ok = true
	return
}

