package main

import (
	"io"
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
		return nil, err
	}
	quit := make(chan bool)
	go func() {
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

func updateItunes(fn string, errlog *logging.Logger) error {
	l := loader.NewLoader()
	go l.Load(fn)
	tracks := -1
	playlists := -1
	for {
		select {
		case update := <-l.LibraryCh:
			if tracks == -1 && update.Tracks != nil && *update.Tracks > 0 {
				tracks = *update.Tracks
				errlog.Infof("%d itunes tracks updated", tracks)
			}
			if playlists == -1 && update.Playlists != nil && *update.Playlists > 0 {
				tracks = *update.Playlists
				errlog.Infof("%d itunes playlists updated", playlists)
			}
		case track := <-l.TrackCh:
			if track.GetDisabled() {
				continue
			}
			if track.Location == nil {
				continue
			}
			err := db.UpdateITunesTrack(track)
			if err != nil {
				l.Abort()
				return err
			}
		case playlist := <-l.PlaylistCh:
			err := db.UpdateITunesPlaylist(playlist)
			if err != nil {
				l.Abort()
				return err
			}
		case err := <-l.ErrorCh:
			if err == nil || err == io.EOF {
				l.Drain()
				return err
			}
			l.Drain()
			return err
		}
	}
	l.Drain()
	return nil
}
