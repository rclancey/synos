package main

import (
	"fmt"
	"os"
	"strconv"
	"musicdb"
)

func main() {
	for _, nums := range os.Args[1:] {
		num, err := strconv.ParseInt(nums, 10, 64)
		if err != nil {
			fmt.Printf("%s: ERROR: %s\n", nums, err)
		} else {
			pid := new(musicdb.PersistentID)
			pid.Scan(num)
			fmt.Printf("%s: %s\n", nums, pid)
		}
	}
}
