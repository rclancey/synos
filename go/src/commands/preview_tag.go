package main

import (
	"encoding/json"
	"log"
	"os"

	"musicdb"
)

func main() {
	mediaPath := []string{"/Users/rclancey", "/Volumes/MultiMedia", "/Volumes/music"}
	finder := musicdb.NewFileFinder("Music/iTunes/iTunes Music", mediaPath, mediaPath)
	musicdb.SetGlobalFinder(finder)
	db, err := musicdb.Open("dbname=musicdb sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	var trid musicdb.PersistentID
	tridp := &trid
	err = tridp.Decode(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	tr, err := db.GetTrack(trid)
	if err != nil {
		log.Fatal(err)
	}
	dbvals := map[string]string{}
	tagvals := map[string]string{}
	if tr.Name != nil {
		dbvals["name"] = *tr.Name
		tr.Name = nil
	}
	if tr.Artist != nil {
		dbvals["artist"] = *tr.Artist
		tr.Artist = nil
	}
	if tr.Album != nil {
		dbvals["album"] = *tr.Album
		tr.Album = nil
	}
	if tr.AlbumArtist != nil {
		dbvals["album_artist"] = *tr.AlbumArtist
		tr.AlbumArtist = nil
	}
	tagvals["name"], _ = tr.GetName()
	tagvals["artist"], _ = tr.GetArtist()
	tagvals["album"], _ = tr.GetAlbum()
	tagvals["album_artist"], _ = tr.GetAlbumArtist()
	data, err := json.MarshalIndent(map[string]interface{}{
		"db": dbvals,
		"tag": tagvals,
	}, "", "  ")
	if err != nil {
		log.Fatal(err)
	}
	os.Stdout.Write(data)
	os.Stdout.Write([]byte("\n"))
}
