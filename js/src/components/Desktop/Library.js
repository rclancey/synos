import React, { useState, useRef, useEffect, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";
import { trackDB } from '../../lib/trackdb';
import { WS } from '../../lib/ws';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { useControlAPI } from '../Player/Context';
import { PlaylistBrowser } from './Playlists/PlaylistBrowser';
import { TrackBrowser } from './Tracks/TrackBrowser';
import { ProgressBar } from './ProgressBar';

const loadTracks = (api, page, size, since, onProgress) => {
  //console.debug('loading tracks from database, page %o', page);
  return api.loadTracks(page, size, since)
    .then(tracks => {
      if (tracks === null) {
        return false;
      }
      return trackDB.updateTracks(tracks)
        .then(() => {
          onProgress(tracks.length);
          return loadTracks(api, page + 1, size, since, onProgress);
        });
    })
};

const addPlaylistTimestamp = (pls, timestamp) => {
  if (!pls) {
    return pls;
  }
  return pls.map(pl => {
    if (pl.folder) {
      return Object.assign({}, pl, { children: addPlaylistTimestamp(pl.children, timestamp) });
    } else {
      return Object.assign({}, pl, { timestamp });
    }
  });
};

export const Library = ({
  playlist,
  track,
  search,
  setPlaylist,
  setPlayer,
  onShowInfo,
  onShowMultiInfo,
}) => {
  const api = useAPI(API);
  const loading = useRef(false);
  const [libraryUpdate, setLibraryUpdate] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const newest = useRef(0);

  const [device, setDevice] = useState(null);

  useEffect(() => {
    if (loading.current) {
      return;
    }
    loading.current = true;
    //console.debug('loading track database');
    const onProgress = n => {
      setLoadedCount(c => c + n);
    };
    const updatePlaylists = pls => {
      setPlaylists(addPlaylistTimestamp(pls, Date.now()));
    };

    console.debug('libraryUpdate = %o', libraryUpdate);
    trackDB.getNewest()
      .then(t => {
        newest.current = t;
        return api.loadTrackCount(t);
      })
      .then(c => setLoadingCount(c + 1))
      .then(() => trackDB.countTracks())
      .then(c => setLoadingCount(orig => orig + c))
      .then(() => loadTracks(api, 1, 100, newest.current, onProgress))
      //.then(() => console.debug('finished loading tracks from server'))
      .then(() => api.loadPlaylists())
      .then(updatePlaylists)
      .then(() => trackDB.loadTracks(1000, () => onProgress(1000)))
      .then(tracks => setTracks(tracks))
      .then(() => trackDB.getNewest())
      .then(t => newest.current = t)
      .then(() => { setLoadingComplete(true); loading.current = false; });
  }, [api, libraryUpdate]);

  useEffect(() => {
    const openHandler = () => {
      console.debug('websocket reopened, refreshing library');
      setLibraryUpdate(Date.now());
      /*
      const count = { current: 0 };
      const onProgress = n => count.current += 1;
      trackDB.getNewest()
        .then(t => {
          newest.current = t;
          return loadTracks(api, 1, 100, t, onProgress);
        })
        .then(() => api.loadPlaylists())
        .then(updatePlaylists)
        .then(() => {
          if (count.current === 0) {
            return;
          }
          return trackDB.loadTracks(1000).then(setTracks);
        })
        .then(() => trackDB.getNewest())
        .then(t => newest.current = t);
      */
    };

    const msgHandler = msg => {
      if (msg.type !== 'library update') {
        console.debug('ignoring message %o', msg.type)
        return;
      }
      console.debug('got library update message');
      setLibraryUpdate(Date.now());
      /*
      if (msg.playlists && msg.playlists.length > 0) {
        api.loadPlaylists().then(updatePlaylists);
      } else if (msg.tracks && msg.tracks.length > 0) {
        setTracks(orig => {
          const ids = new Set(msg.tracks.map(tr => tr.persistent_id));
          const tracks = orig.filter(tr => !ids.has(tr.persistent_id));
          return tracks.concat(msg.tracks);
        });
      }
      */
    };
    WS.on('open', openHandler);
    WS.on('message', msgHandler);
    return () => {
      WS.off('open', openHandler);
      WS.off('message', msgHandler);
    };
  }, [api]);

  /*
  const reloaddb = useCallback(() => {
    const onProgress = n => {
      setLoadedCount(c => c + n);
    };
    const updatePlaylists = pls => {
      setPlaylists(addPlaylistTimestamp(pls, Date.now()));
    };

    trackDB.clear()
      .then(t => {
        newest.current = 0;
        return api.loadTrackCount(0);
      })
      .then(c => setLoadingCount(c + 1))
      .then(() => trackDB.countTracks())
      .then(c => setLoadingCount(orig => orig + c))
      .then(() => loadTracks(api, 1, 100, newest.current, onProgress))
      .then(() => api.loadPlaylists())
      .then(updatePlaylists)
      .then(() => trackDB.loadTracks(1000, () => onProgress(1000)))
      .then(tracks => setTracks(tracks))
      .then(() => trackDB.getNewest())
      .then(t => newest.current = t)
      .then(() => setLoadingComplete(true));
  }, [api]);
  */

  const onSelectPlaylist = useCallback((pl, dev) => {
    //console.error('onSelectPlaylist(%o, %o)', pl, dev);
    if (!dev) {
      if (!pl) {
        setPlaylist(null);
        setDevice(null);
        window.localStorage.setItem('lastPlaylist', '');
        return;
      }
      if (pl.folder) {
        return;
      }
      api.loadPlaylist(pl.persistent_id)
        .then(xpl => {
          setPlaylist(xpl);
          setDevice(null);
          window.localStorage.setItem('lastPlaylist', xpl.persistent_id);
        });
    } else {
      setDevice(dev);
      setPlaylist(pl);
    }
  }, [api, setPlaylist]);
  const onMovePlaylist = useCallback(({ source, target }) => {
    console.debug('onMovePlaylist: %o', { source, target });
    api.movePlaylist(source.playlist, target.playlist)
      .then(() => api.loadPlaylists())
      .then(pls => setPlaylists(addPlaylistTimestamp(pls, Date.now())));
  }, [api]);
  const onAddToPlaylist = useCallback(({ source, target }) => {
    console.debug('onAddToPlaylist: %o', { source, target });
    if (target.playlist && source.tracks && source.tracks.length > 0) {
      api.addToPlaylist(target.playlist, source.tracks.map(tr => tr.track));
    }
  }, [api]);
  const onReorderTracks = useCallback((playlist, targetIndex, sourceIndices) => {
    console.debug('onReorderTracks: %o', { playlist, targetIndex, sourceIndices });
    if (playlist && sourceIndices && sourceIndices.length > 0) {
      api.reorderTracks(playlist, targetIndex, sourceIndices)
        .then(() => api.loadPlaylist(playlist.persistent_id))
        .then(pl => setPlaylist(pl));
    }
  }, [api, setPlaylist]);
  const onDeleteTracks = useCallback((playlist, selected) => {
    console.debug('onDeleteTracks: %o', { playlist, selected });
    if (playlist && selected && selected.length > 0) {
      api.deletePlaylistTracks(playlist, selected);
    }
  }, [api]);
  /*
  const onCreatePlaylist = useCallback((playlist) => {
    api.createPlaylist(playlist)
      .then(() => api.loadPlaylists())
      .then(pls => setPlaylists(addPlaylistTimestamp(pls, Date.now())));
  }, [api]);
  */

  useEffect(() => {
    const plid = window.localStorage.getItem('lastPlaylist');
    if (plid) {
      onSelectPlaylist({ persistent_id: plid });
    }
  }, [onSelectPlaylist]);
  const controlAPI = useControlAPI();

  return (
    <>
      <div key="library" className="library">
        <PlaylistBrowser
          playlists={playlists}
          selected={playlist ? playlist.persistent_id : null}
          onSelect={onSelectPlaylist}
          onMovePlaylist={onMovePlaylist}
          onAddToPlaylist={onAddToPlaylist}
          controlAPI={controlAPI}
          setPlayer={setPlayer}
        />
        { device || (
          <TrackBrowser
            columnBrowser={true}
            playlist={playlist}
            tracks={playlist ? playlist.items : tracks}
            search={search}
            onReorder={onReorderTracks}
            onDelete={onDeleteTracks}
            controlAPI={controlAPI}
            onShowInfo={onShowInfo}
            onShowMultiInfo={onShowMultiInfo}
          />
        ) }
        <style jsx>{`
          .library {
            flex: 100;
            display: flex;
            flex-direction: row;
            overflow: hidden;
          }
        `}</style>
      </div>
      { loadingComplete ? null : (
        <ProgressBar
          key="progress"
          total={loadingCount}
          complete={loadedCount}
        />
      ) }
    </>
  );
};
