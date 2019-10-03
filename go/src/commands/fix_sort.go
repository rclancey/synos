package main

import (
	"log"
	"os"
	"strconv"
	"musicdb"
)

func main() {
	db, err := musicdb.Open("dbname=musicdb sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	tracks := []*musicdb.Track{}
	for _, pid_str := range os.Args[1:] {
		pid_signed, err := strconv.ParseInt(pid_str, 10, 64)
		if err != nil {
			log.Fatal(err)
		}
		var pid musicdb.PersistentID
		xpid := &pid
		err = xpid.Scan(pid_signed)
		if err != nil {
			log.Fatal(err)
		}
		tr, err := db.GetTrack(pid)
		if err != nil {
			log.Fatal(err)
		}
		tr.SortName = nil
		tr.SortArtist = nil
		tr.SortAlbum = nil
		tr.SortAlbumArtist = nil
		tr.SortComposer = nil
		tr.SortGenre = nil
		tracks = append(tracks, tr)
	}
	err = db.SaveTracks(tracks)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("tracks saved")
}

