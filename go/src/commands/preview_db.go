package main

import (
	"bufio"
	"fmt"
	"log"
	"os"

	"github.com/kballard/go-shellquote"

	"itunesdb"
)

func main() {
	db, err := itunesdb.NewDB()
	if err != nil {
		log.Println(err)
		return
	}
	err = db.Load(os.Args[1])
	if err != ni {
		log.Println(err)
		return
	}
	log.Println("database loaded")
	reader := bufio.NewReader(os.Stdin)
	for {
		os.Stdout.Write([]byte("itunes> "))
		os.Stdout.Flush()
		cmdString, err := reader.ReadString('\n')
		if err == io.EOF {
			os.Stdout.Write([]byte("\n"))
			break
		}
		if err != nil {
			log.Println(err)
			return
		}
		parts, err := shellquote.Split(cmdString)
		if err != nil {
			fmt.Println(err)
			continue
		}
		switch parts[0] {
		case "genres":
		case "artists":
		case "albums":
		case "tracks":
		case "track"
		case "playlists":
		case "playlist-tracks":
		case "playlist":
		default:
		}
	}
	os.Stdout.Write([]byte("goodbye\n"))
}

