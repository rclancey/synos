import React, { useMemo, useState, useRef, useEffect, useContext } from 'react';
import { trackDB } from '../../lib/trackdb';
import { WS } from '../../lib/ws';
import { API } from '../../lib/api';
import { LoginContext } from '../../lib/login';
import { PlaylistBrowser } from './Playlists/PlaylistBrowser';
import { TrackBrowser } from './Tracks/TrackBrowser';
import { ProgressBar } from './ProgressBar';

const loadTracks = (api, page, size, since, onProgress) => {
  api.loadTracks(page, size, since)
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
  controlAPI,
  setPlaylist,
}) => {
  const { onLoginRequired } = useContext(LoginContext);
  const api = useMemo(() => new API(onLoginRequired), [onLoginRequired]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const newest = useRef(0);

  const [device, setDevice] = useState(null);

  useEffect(() => {
    const onProgress = n => {
      setLoadedCount(c => c + n);
    };
    const updatePlaylists = pls => {
      setPlaylists(addPlaylistTimestamp(pls, Date.now()));
    };

    trackDB.getNewest()
      .then(t => {
        newest.current = t;
        return api.loadTrackCount(t);
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

    const openHandler = () => {
      console.debug('websocket reopened, refreshing library');
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
    };
    const msgHandler = msg => {
      if (msg.type !== 'library') {
        return;
      }
      console.debug('got library update message');
      if (msg.playlists && msg.playlists.length > 0) {
        api.loadPlaylists().then(updatePlaylists);
      } else if (msg.tracks && msg.tracks.length > 0) {
        setTracks(orig => {
          const ids = new Set(msg.tracks.map(tr => tr.persistent_id));
          const tracks = orig.filter(tr => !ids.has(tr.persistent_id));
          return tracks.concat(msg.tracks);
        });
      }
    };
    WS.on('open', openHandler);
    WS.on('message', msgHandler);
    return () => {
      WS.off('open', openHandler);
      WS.off('message', msgHandler);
    };
  }, []);

  const onSelectPlaylist = useMemo(() => {
    return (pl, dev) => {
      console.debug('onSelectPlaylist(%o, %o)', pl, dev);
      if (!dev) {
        if (pl.folder) {
          return;
        }
        api.loadPlaylist(pl.persistent_id)
          .then(xpl => {
            setPlaylist(xpl);
            setDevice(null);
          });
      } else {
        setDevice(dev);
        setPlaylist(pl);
      }
    };
  }, [api, setPlaylist]);
  const onMovePlaylist = useMemo(() => {
    return ({ source, target }) => {
      console.debug('onMovePlaylist: %o', { source, target });
    };
  }, [api]);
  const onAddToPlaylist = useMemo(() => {
    return ({ source, target }) => {
      console.debug('onAddToPlaylist: %o', { source, target });
    };
  }, [api]);
  const onReorderTracks = useMemo(() => {
    return (playlist, targetIndex, sourceIndices) => {
      console.debug('onReorderTracks: %o', { playlist, targetIndex, sourceIndices });
    };
  }, [api]);
  const onDeleteTracks = useMemo(() => {
    return (playlist, selected) => {
      console.debug('onDeleteTracks: %o', { playlist, selected });
    };
  }, [api]);

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
