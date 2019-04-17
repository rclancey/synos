package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"strconv"
	"time"

	"github.com/chzyer/readline"

	"itunes"
	//"itunesdb"
)

func main() {
	/*
	fn := os.Args[1]
	lib := itunes.NewLibrary()
	err := lib.Load(fn)
	if err != nil {
		fmt.Println(err)
		return
	}
	txt, err := json.MarshalIndent(lib, "", "  ");
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(txt))
	*/
	/*
	db, err := itunesdb.GetDB()
	if err != nil {
		fmt.Println(err)
		return
	}
	usernames, err := db.GetUsers()
	if err != nil {
		fmt.Println(err)
		return
	}
	txt, err := json.MarshalIndent(usernames, "", "  ")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(txt))
	*/
	/*
	owner_id, valid := db.Login(os.Args[1], os.Args[2])
	if valid {
		fmt.Println("valid login")
	} else {
		fmt.Println("failed login")
		return
	}
	*/
	lib := itunes.NewLibrary()
	fn := os.Args[3]
	err := lib.Load(fn)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("library loaded")
	fmt.Printf("%d tracks in library\n", len(lib.TrackList))
	j := 0
	for i := 0; i < len(lib.TrackList); i += 100 {
		fn := strconv.Itoa(j)+".json"
		last := i+100
		if last > len(lib.TrackList) {
			last = len(lib.TrackList)
		}
		os.Stdout.Write([]byte(fmt.Sprintf("\r%s (%d - %d)", fn, i, last)))
		os.Stdout.Sync()
		data, err := json.Marshal(lib.TrackList[i:last])
		if err != nil {
			fmt.Println(err)
			return
		}
		ioutil.WriteFile(fn, data, 0644)
		j += 1
	}
	pls := make([]*itunes.Playlist, 0, len(lib.Playlists))
	for _, pl := range lib.PlaylistIDIndex {
		if (pl.Folder == nil || *pl.Folder == false) && pl.SmartInfo != nil && len(pl.SmartInfo) > 0 && pl.SmartCriteria != nil && len(pl.SmartCriteria) > 0 {
			fmt.Println("smart playlist", *pl.Name, *pl.PlaylistPersistentID)
			s, err := itunes.ParseSmartPlaylist(pl.SmartInfo, pl.SmartCriteria)
			if err != nil {
				fmt.Println("bad playlist", *pl.PlaylistPersistentID, err)
				fmt.Println("info:", string(pl.SmartInfo))
				fmt.Println("criteria:", string(pl.SmartCriteria))
			} else {
				pl.Smart = s
			}
		}
	}
	for _, pl := range lib.Playlists {
		//if !pl.IsSystemPlaylist() {
			pls = append(pls, pl.Prune())
		//}
	}
	data, err := json.Marshal(pls)
	if err != nil {
		fmt.Println(err)
		return
	}
	ioutil.WriteFile("playlists.json", data, 0644)
	for id, pl := range lib.PlaylistIDIndex {
		//if !pl.IsSystemPlaylist() {
			trackIds := make([]string, 0, len(pl.PlaylistItems))
			for _, t := range pl.PlaylistItems {
				if t.PersistentID != nil {
					trackIds = append(trackIds, *t.PersistentID)
				}
			}
			data, err := json.Marshal(trackIds)
			if err != nil {
				fmt.Println(err)
				return
			}
			ioutil.WriteFile(id+".json", data, 0644)
		//}
	}
	os.Stdout.Write([]byte("\n"))
	/*
	out, err := json.MarshalIndent(lib.TrackList, "", " ")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(out))
	*/
	return
	for _, track := range lib.Tracks {
		if track.TrackType != nil && *track.TrackType == "URL" {
			continue
		}
		if track.Location == nil || !strings.HasPrefix(*track.Location, "file://") {
			continue
		}
		_, err = os.Stat(track.Path())
		if err != nil {
			fmt.Println(track.Path())
		}
	}
	rl, err := readline.New("Playlist? ")
	if err != nil {
		fmt.Println(err)
		return
	}
	for {
		line, err := rl.Readline()
		if err != nil {
			break
		}
		pl := lib.GetPlaylistByPath(line)
		if pl == nil {
			continue
		}
		for _, track := range pl.PlaylistItems {
			fmt.Println(track.Path())
		}
		dur := ""
		t := pl.TotalTime()
		if t >= 24 * time.Hour {
			dur += fmt.Sprintf("%d days, ", int(t.Hours() / 24))
		}
		dur += fmt.Sprintf("%02d:%02d", int(t.Hours()) % 24, int(t.Minutes()) % 60)
		fmt.Printf("%d songs * %s\n", len(pl.PlaylistItems), dur)
	}
	/*
	err = db.UpdateLibrary(lib, owner_id)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("library updated")
	tracks, err := db.GetLibraryTracks(*lib.LibraryPersistentID)
	if err != nil {
		fmt.Println(err)
		return
	}
	//fmt.Println(*tracks[0].Location)
	txt, err = json.MarshalIndent(tracks, "", "  ")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(txt))
	*/
}

