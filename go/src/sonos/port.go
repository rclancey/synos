package sonos

import (
	"net"
	"strconv"

	"github.com/pkg/errors"
)

func portIsAvailable(port int) bool {
	ln, err := net.Listen("tcp", ":" + strconv.Itoa(port))
	if err != nil {
		return false
	}
	ln.Close()
	return true
}

func findFreePortPair(start, end int) (int, int, error) {
	p := start
	for p < end {
		if !portIsAvailable(p) {
			p += 1
			continue
		}
		if !portIsAvailable(p + 1) {
			p += 2
			continue
		}
		return p, p + 1, nil
	}
	return 0, 0, errors.New("no free ports in range")
}

