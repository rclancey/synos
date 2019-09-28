package main

import (
	//"io"
	//"log"
	"time"

	"file-monitor"
	"itunes/loader"
	"logging"
	"musicdb"
)

func WatchITunes() (chan bool, error) {
	errlog, err := cfg.Logging.ErrorLogger()
	if err != nil {
		return nil, err
	}
	finder := musicdb.GetGlobalFinder()
	fn, err := finder.FindFile(cfg.ITunes.Library)
	if err != nil {
		errlog.Warn("can't find itunes library")
		return nil, err
	}
	quit := make(chan bool)
	go func() {
		errlog.Info("monitoring itunes library", fn)
		mon := monitor.NewFileMonitor(fn, 10 * time.Second, 5 * time.Second)
		for {
			select {
			case <-quit:
				mon.Stop()
				break
			case <-mon.C:
				errlog.Info("itunes library update")
				err := updateItunes(fn, errlog)
				if err != nil {
					errlog.Error(err)
				} else {
					errlog.Info("itunes library update complete")
				}
			}
		}
	}()
	return quit, nil
}

type LibraryEvent struct {
	Type string `json:"type"`
	Playlists []*musicdb.Playlist `json:"playlists,omitempty"`
	Tracks []*musicdb.Track `json:"tracks,omitempty"`
}

func updateItunes(fn string, errlog *logging.Logger) error {
	l := loader.NewLoader()
	go l.Load(fn)
	tracks := -1
	playlists := -1
	//count := 0
	errlog.Info("begin itunes library update")
	evt := &LibraryEvent{
		Type: "library",
		Playlists: []*musicdb.Playlist{},
		Tracks: []*musicdb.Track{},
	}
	for {
		update, ok := <-l.C
		if !ok {
			//errlog.("loader channel closed")
			if len(evt.Playlists) > 0 || len(evt.Tracks) > 0 {
				hub, err := getWebsocketHub()
				if err == nil {
					hub.BroadcastEvent(evt)
				}
			}
			return nil
		}
		/*
		if count % 1000 == 0 {
			errlog.Debug(count, "messages")
		}
		count += 1
		*/
		switch tupdate := update.(type) {
		case *loader.Library:
			//errlog.Debug("library update")
			if tracks == -1 && tupdate.Tracks != nil && *tupdate.Tracks > 0 {
				tracks = *tupdate.Tracks
				errlog.Infof("%d itunes tracks updated", tracks)
			}
			if playlists == -1 && tupdate.Playlists != nil && *tupdate.Playlists > 0 {
				playlists = *tupdate.Playlists
				errlog.Infof("%d itunes playlists updated", playlists)
			}
		case *loader.Track:
			if tupdate.GetDisabled() {
				// noop
			} else if tupdate.Location == nil {
				// noop
			} else {
				updated, err := db.UpdateITunesTrack(tupdate)
				if err != nil {
					errlog.Error("error updating track:", err)
					l.Abort()
					return err
				}
				if updated && tupdate.PersistentID != nil {
					tr, err := db.GetTrack(musicdb.PersistentID(*tupdate.PersistentID))
					if err == nil {
						evt.Tracks = append(evt.Tracks, tr)
					}
				}
			}
		case *loader.Playlist:
			updated, err := db.UpdateITunesPlaylist(tupdate)
			if err != nil {
				errlog.Error("error updating playlist:", err)
				l.Abort()
				return err
			}
			if updated && tupdate.PersistentID != nil {
				pl, err := db.GetPlaylist(musicdb.PersistentID(*tupdate.PersistentID))
				if err == nil {
					evt.Playlists = append(evt.Playlists, pl)
				}
			}
		case error:
			errlog.Error("error in loader:", tupdate)
			l.Abort()
			return tupdate
		default:
			errlog.Errorf("unexpected type on loader channel: %T", update)
		}
	}
	errlog.Debug("don't know how we got here, but returning")
	return nil
}
