package main

import (
	"fmt"
	"os"

	"musicdb"
)

func main() {
	inp := os.Args[1]
	var srt string
	if inp == "-a" || inp == "--artist" {
		inp = os.Args[2]
		srt = musicdb.MakeSortArtist(inp)
	} else {
		srt = musicdb.MakeSort(inp)
	}
	fmt.Println("input:", inp)
	fmt.Println("sort: ", srt)
}

