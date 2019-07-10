package main

import (
	"fmt"
	"io"
	"log"
	"os"
	//"path"
	"path/filepath"

	"itunes/loader"
	"musicdb"
)

func main() {
	mediaFolder := "Music/iTunes/iTunes Music"
	sourcePath := []string{
		os.Getenv("HOME"),
		"/Volumes/MultiMedia",
		"/Volumes/music",
		"/volume1/music",
		"/Volumes/Video",
		"/volume1/video",
		filepath.Join(os.Getenv("HOME"), "nocode/rclancey"),
		filepath.Join(os.Getenv("HOME"), "dogfish/rclancey"),
	}
	finder := musicdb.NewFileFinder(mediaFolder, sourcePath, sourcePath)
	musicdb.SetGlobalFinder(finder)
	db, err := musicdb.Open("dbname=musicdb sslmode=disable")
	if err != nil {
		log.Fatal(err)
		return
	}
	log.Println("database opened, loading library")
	fn := os.Args[1]
	l := loader.NewLoader()
	load(db, l, fn)
	log.Println("all done")
}

func load(db *musicdb.DB, l *loader.Loader, fn string) {
	go l.Load(fn)
	tracks := 0
	for {
		select {
		case update := <-l.LibraryCh:
			log.Println("library update")
			if update.Tracks != nil && *update.Tracks > 0 {
				log.Printf("%d tracks loaded ", *update.Tracks)
			}
			if update.Playlists != nil && *update.Playlists > 0 {
				log.Printf("%d playlists loaded", *update.Playlists)
			}
		case track := <-l.TrackCh:
			if track.GetDisabled() {
				continue
			}
			if track.Location == nil {
				continue
			}
			tracks += 1
			os.Stdout.Write([]byte(fmt.Sprintf("\r%d tracks", tracks)))
			/*
			if track.GetMusicVideo() {
				continue
			}
			//continue
			if track.GetPodcast() {
				continue
			}
			if track.GetMovie() {
				continue
			}
			if track.GetTVShow() {
				continue
			}
			if track.GetHasVideo() {
				continue
			}
			if path.Ext(track.GetLocation()) == ".m4b" {
				// audiobook
				continue
			}
			*/
			err := db.UpdateITunesTrack(track)
			if err != nil {
				log.Fatal(err)
			}
		case playlist := <-l.PlaylistCh:
			//log.Println("dealing with playlist", musicdb.PersistentID(*playlist.PersistentID).String())
			/*
			if playlist.GetMaster() {
				log.Println("skipping master")
				continue
			}
			if playlist.GetMusic() {
				log.Println("skipping music")
				continue
			}
			if playlist.GetMovies() {
				log.Println("skipping movies")
				continue
			}
			if playlist.GetPodcasts() {
				log.Println("skipping podcasts")
				continue
			}
			if playlist.GetPurchasedMusic() {
				log.Println("skipping purchased music")
				continue
			}
			if playlist.GetAudiobooks() {
				log.Println("skipping audiobooks")
				continue
			}
			if !playlist.GetVisible() {
				log.Println("skipping invisible")
				continue
			}
			*/
			err := db.UpdateITunesPlaylist(playlist)
			if err != nil {
				log.Fatal(err)
			}
			//log.Println("updated playlist %s", playlist.GetName())
		case err := <-l.ErrorCh:
			log.Println("handling error")
			if err == nil || err == io.EOF {
				log.Println("loading complete")
				return
			}
			log.Fatal(err)
		}
	}
}

