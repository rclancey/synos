package api

import (
	//"io"
	//"log"
	"time"

	"github.com/pkg/errors"

	"github.com/rclancey/file-monitor"
	"github.com/rclancey/itunes/loader"
	"github.com/rclancey/logging"
	"github.com/rclancey/synos/musicdb"
)

func WatchITunes() (chan bool, error) {
	errlog, err := cfg.Logging.ErrorLogger()
	if err != nil {
		return nil, err
	}
	errlog.Debugln("looking for itunes library files", cfg.ITunes.Library)
	users, err := db.ListUsers()
	if err != nil {
		errlog.Errorln("error loading users:", err)
		return nil, err
	}
	finder := musicdb.GetGlobalFinder()
	fns := []string{}
	userByLibrary := map[string]*musicdb.User{}
	for _, user := range users {
		found := false
		if user.HomeDirectory != nil {
			for _, libname := range cfg.ITunes.Library {
				fn, err := finder.FindFile(libname, user.HomeDirectory)
				if err == nil {
					fns = append(fns, fn)
					userByLibrary[fn] = user
					found = true
					break
				}
			}
		}
		if !found {
			errlog.Debugln("no library file found for", user.Username)
		}
	}
	if len(fns) == 0 {
		errlog.Warn("can't find itunes libraries")
		return nil, errors.New("no itunes libraries")
	} else {
		errlog.Debugln("watching itunes library files", fns)
	}
	quit := make(chan bool)
	uchan := db.UserUpdateChannel()
	go func() {
		mon := monitor.NewFileMonitor(10 * time.Second, 5 * time.Second, fns...)
		for {
			select {
			case <-quit:
				mon.Stop()
				break
			case user := <-uchan:
				fns := []string{}
				var dfn string
				for xfn, xuser := range userByLibrary {
					if xuser.PersistentID == user.PersistentID {
						for _, zfn := range mon.FileNames {
							if zfn != xfn {
								fns = append(fns, zfn)
							} else {
								dfn = zfn
							}
						}
					}
				}
				if dfn != "" {
					delete(userByLibrary, dfn)
				}
				if user.HomeDirectory != nil {
					var fn string
					var err error
					for _, libname := range cfg.ITunes.Library {
						fn, err = finder.FindFile(libname, user.HomeDirectory)
						if err == nil {
							break
						}
					}
					if fn == "" {
						continue
					}
					fns = append(fns, fn)
					userByLibrary[fn] = user
				}
				mon.FileNames = fns
			case change := <-mon.C:
				fn := change.FileName
				user, ok := userByLibrary[fn]
				if !ok {
					continue
				}
				errlog.Infoln("itunes library update", user.Username, fn)
				err := updateItunes(user, fn, errlog)
				if err != nil {
					errlog.Error(err)
				} else {
					errlog.Infoln("itunes library update complete", user.Username)
				}
				errlog.Infoln("update folder tracks", user.Username)
				err = db.UpdateFolderTracks()
				if err != nil {
					errlog.Error(err)
				}
				errlog.Infoln("update smart tracks", user.Username)
				err = db.UpdateSmartTracks()
				if err != nil {
					errlog.Error(err)
				}
				hub, err := getWebsocketHub()
				if err != nil {
					errlog.Error(err)
				} else if hub != nil {
					hub.Broadcast([]byte(`{"type":"library update"}`))
				}
			}
		}
	}()
	return quit, nil
}

type LibraryEvent struct {
	Type string `json:"type"`
	User *musicdb.User `json:"user"`
	Playlists []*musicdb.Playlist `json:"playlists,omitempty"`
	Tracks []*musicdb.Track `json:"tracks,omitempty"`
}

func updateItunes(user *musicdb.User, fn string, errlog *logging.Logger) error {
	deletedTracks, err := db.LoadITunesTrackIDs(user)
	if err != nil {
		return err
	}
	deletedPlaylists, err := db.LoadITunesPlaylistIDs(user)
	if err != nil {
		return err
	}
	l := loader.NewLoader()
	go l.Load(fn)
	tracks := -1
	playlists := -1
	//count := 0
	errlog.Info("begin itunes library update")
	evt := &LibraryEvent{
		Type: "library",
		User: user.Clean(),
		Playlists: []*musicdb.Playlist{},
		Tracks: []*musicdb.Track{},
	}
	for {
		update, ok := <-l.C
		if !ok {
			//errlog.("loader channel closed")
			err = db.DeleteITunesTracks(deletedTracks, user)
			if err != nil {
				return err
			}
			err = db.DeleteITunesPlaylists(deletedPlaylists, user)
			if err != nil {
				return err
			}
			if len(evt.Playlists) > 0 || len(evt.Tracks) > 0 || len(deletedTracks) > 0 || len(deletedPlaylists) > 0 {
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
				errlog.Infof("%d / %d itunes tracks updated", len(evt.Tracks), tracks)
			}
			if playlists == -1 && tupdate.Playlists != nil && *tupdate.Playlists > 0 {
				playlists = *tupdate.Playlists
				errlog.Infof("%d / %d itunes playlists updated", len(evt.Playlists), playlists)
			}
		case *loader.Track:
			if tupdate.PersistentID != nil {
				pid := musicdb.PersistentID(*tupdate.PersistentID).String()
				delete(deletedTracks, pid)
			}
			if tupdate.GetDisabled() {
				// noop
			} else if tupdate.Location == nil {
				// noop
			} else {
				updated, err := db.UpdateITunesTrack(tupdate, user)
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
			if tupdate.PersistentID != nil {
				pid := musicdb.PersistentID(*tupdate.PersistentID).String()
				delete(deletedPlaylists, pid)
			}
			updated, err := db.UpdateITunesPlaylist(tupdate, user)
			if err != nil {
				errlog.Error("error updating playlist:", err)
				l.Abort()
				return err
			}
			if updated && tupdate.PersistentID != nil {
				pl, err := db.GetPlaylist(musicdb.PersistentID(*tupdate.PersistentID), user)
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
