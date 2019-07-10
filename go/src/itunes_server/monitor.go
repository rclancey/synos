package main

import (
	"encoding/binary"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"runtime/debug"
	"time"

	"itunes"
)

func BootstrapPlaylists() {
	dn := filepath.Join(cfg.CacheDirectory, "library", "master", "playlists")
	d, err := os.Open(dn)
	if err != nil {
		return
	}
	infos, _ := d.Readdir(-1)
	for _, info := range infos {
		var pid itunes.PersistentID
		if (&pid).DecodeString(info.Name()) == nil {
			pl := &itunes.Playlist{PersistentID: pid}
			pl.TrackIDs, _ = getPlaylistTrackIds(nil, pl)
			lib.Playlists[pid] = pl
			pl.Nest(lib)
		}
	}
}

func getPlaylistTrackIdPath(xlib *itunes.Library, pl *itunes.Playlist) string {
	var libid string
	if xlib == nil {
		libid = "master"
	} else {
		libid = xlib.PersistentID.String()
	}
	return filepath.Join(cfg.CacheDirectory, "library", libid, "playlists", pl.PersistentID.String())
}

func getPlaylistTrackIds(xlib *itunes.Library, pl *itunes.Playlist) ([]itunes.PersistentID, error) {
	fn := getPlaylistTrackIdPath(xlib, pl)
	f, err := os.Open(fn)
	if err != nil {
		return nil, err
	}
	pids := []itunes.PersistentID{}
	var pid uint64
	for {
		err = binary.Read(f, binary.BigEndian, &pid)
		if err != nil {
			if err == io.EOF {
				break
			} else {
				return nil, err
			}
		}
		pids = append(pids, itunes.PersistentID(pid))
	}
	return pids, nil
}

func storePlaylistTrackIds(xlib *itunes.Library, pl *itunes.Playlist) error {
	fn := getPlaylistTrackIdPath(xlib, pl)
	err := itunes.EnsureDir(fn)
	if err != nil {
		return err
	}
	f, err := os.Create(fn)
	if err != nil {
		return err
	}
	for _, pid := range pl.TrackIDs {
		binary.Write(f, binary.BigEndian, uint64(pid))
	}
	return f.Close()
}

func updatePlaylist(pl, xpl *itunes.Playlist) {
	pl.Name = xpl.Name
	pl.Move(lib, xpl.ParentPersistentID)
	if pl.Folder {
		return
	}
	if pl.GeniusTrackID != nil {
		return
	}
	if pl.Smart != nil {
		if xpl.Smart != nil {
			pl.Smart = xpl.Smart
		}
		return
	}
	orig, err := getPlaylistTrackIds(lib, pl)
	if err != nil {
		orig = pl.TrackIDs
	}
	merged, ok := itunes.ThreeWayMerge(orig, xpl.TrackIDs, pl.TrackIDs)
	if ok {
		pl.TrackIDs = merged
	}
}

func updateLibrary(xlib *itunes.Library) {
	lib.FileName = xlib.FileName
	lib.MajorVersion = xlib.MajorVersion
	lib.MinorVersion = xlib.MinorVersion
	lib.ApplicationVersion = xlib.ApplicationVersion
	lib.Date = xlib.Date
	lib.Features = xlib.Features
	lib.ShowContentRatings = xlib.ShowContentRatings
	lib.PersistentID = xlib.PersistentID
	lib.MusicFolder = xlib.MusicFolder

	tidMap := map[itunes.PersistentID]*itunes.Track{}
	for _, tr := range lib.Tracks {
		tidMap[tr.PersistentID] = tr
	}
	for _, xtr := range xlib.Tracks {
		_, ok := tidMap[xtr.PersistentID]
		if !ok {
			xtr.GetPurchaseDate()
			lib.AddTrack(xtr)
			//lib.Tracks = append(lib.Tracks, xtr)
		}
	}
	toNest := []*itunes.Playlist{}
	for id, xpl := range xlib.Playlists {
		if !xpl.Folder {
			continue
		}
		_, ok := lib.Playlists[id]
		if !ok {
			clone := *xpl
			clone.Children = []*itunes.Playlist{}
			lib.Playlists[id] = &clone
			toNest = append(toNest, &clone)
		}
	}
	for _, pl := range toNest {
		pl.Nest(lib)
	}
	for id, xpl := range xlib.Playlists {
		pl, ok := lib.Playlists[id]
		if !ok {
			clone := *xpl
			clone.Children = nil
			pl = &clone
			lib.Playlists[id] = pl
			pl.Nest(lib)
		} else {
			updatePlaylist(pl, xpl)
			pl.Unnest(lib)
			pl.Nest(lib)
		}
	}
	for _, pl := range xlib.Playlists {
		if pl.Folder || pl.GeniusTrackID != nil || pl.Smart != nil {
			continue
		}
		storePlaylistTrackIds(xlib, pl)
	}
}

func MonitorLibrary(fn string) chan bool {
	quit := make(chan bool)
	go func() {
		lastMod := time.Time{}
		ticker := time.NewTicker(time.Second * 10)
		for {
			select {
			case <-ticker.C:
				xst, xerr := os.Stat(fn)
				if xerr != nil {
					continue
				}
				if xst.ModTime().After(lastMod) {
					if time.Now().Sub(xst.ModTime()).Seconds() > 5.0 {
						xlib := itunes.NewLibrary()
						log.Println("reloading itunes library")
						err := xlib.Load(fn)
						if err == nil {
							log.Println("updating library", xlib.PersistentID)
							updateLibrary(xlib)
							log.Println("library updated")
							lastMod = xst.ModTime()
						}
						xlib = nil
						runtime.GC()
						debug.FreeOSMemory()
					}
				}
			case <-quit:
				ticker.Stop()
				break
			}
		}
	}()
	return quit
}

