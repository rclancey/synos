import React, { useState, useRef, useEffect, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";
import history from 'history';
import {
  BrowserRouter as Router,
  Route,
  useRouteMatch,
  useHistory,
} from 'react-router-dom';

import { trackDB } from '../../lib/trackdb';
import { TH } from '../../lib/trackList';
import { WS } from '../../lib/ws';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { usePlaylistColumns } from '../../lib/playlistColumns';
import { useControlAPI } from '../Player/Context';
import { PlaylistBrowser } from './Playlists/PlaylistBrowser';
import { TrackBrowser } from './Tracks/TrackBrowser';
import { ProgressBar } from './ProgressBar';
import Recents from './Recents';
import ArtistList from './ArtistList';
import AlbumList from './AlbumList';
//import AlbumView from './Tracks/AlbumView';
import AlbumContainer from './AlbumContainer';
import GeniusPlaylist from './GeniusPlaylist';
import ArtistMix from './Playlists/ArtistMix';
import PlaylistContainer from './Playlists/PlaylistContainer';
import JookiDeviceContainer from './Device/Jooki/Container';

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
  const columns = usePlaylistColumns(null);

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

  useEffect(() => TH.update(tracks), [tracks]);

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
        //console.debug('ignoring message %o', msg.type)
        return;
      }
      //console.debug('got library update message');
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
    const special = { recent: true, albums: true, artists: true, genius: true, geniusMix: true };
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
      if (special[pl.persistent_id] || pl.persistent_id.startsWith('genius-mix:')) {
        setPlaylist(pl);
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
        <Router>
          <PlaylistBrowser
            playlists={playlists}
            selected={playlist ? playlist.persistent_id : null}
            onSelect={onSelectPlaylist}
            onMovePlaylist={onMovePlaylist}
            onAddToPlaylist={onAddToPlaylist}
            controlAPI={controlAPI}
            setPlayer={setPlayer}
          />
          <Route exact path="/">
            <TrackBrowser
              columns={columns}
              columnBrowser={true}
              tracks={tracks}
              search={search}
              controlAPI={controlAPI}
              onShowInfo={onShowInfo}
              onShowMultiInfo={onShowMultiInfo}
            />
          </Route>
          <Route path="/recents">
            <Recents />
          </Route>
          <Route exact path="/artists">
            <ArtistList />
          </Route>
          <Route exact path="/artists/:artistName">
            <ArtistList />
          </Route>
          <Route path="/artists/:artistName/mix">
            <ArtistMix
              search={search}
              controlAPI={controlAPI}
              onShowInfo={onShowInfo}
              onShowMultiInfo={onShowMultiInfo}
            />
          </Route>
          <Route exact path="/albums">
            <AlbumList />
          </Route>
          <Route path="/albums/:artistName/:albumName">
            <AlbumContainer />
          </Route>
          <Route exact path="/genius">
            <GeniusPlaylist />
          </Route>
          <Route path="/genius/:genre">
            <GeniusPlaylist />
          </Route>
          {/*
          <Route path="/device/airplay">
            <AirplayDeviceContainer />
          </Route>
          <Route path="/device/android">
            <AndroidDeviceContainer />
          </Route>
          <Route path="/device/apple">
            <AppleDeviceContainer />
          </Route>
          */}
          <Route path="/device/jooki" exact>
            <JookiDeviceContainer setPlayer={setPlayer} />
          </Route>
          <Route path="/device/jooki/:playlistId">
            <JookiDeviceContainer setPlayer={setPlayer} />
          </Route>
          {/*
          <Route path="/device/plex">
            <PlexDeviceContainer />
          </Route>
          <Route path="/device/sonos">
            <SonosDeviceContainer />
          </Route>
          */}
          <Route path="/playlists/:playlistId">
            <PlaylistContainer
              search={search}
              onReorder={onReorderTracks}
              onDelete={onDeleteTracks}
              controlAPI={controlAPI}
              onShowInfo={onShowInfo}
              onShowMultiInfo={onShowMultiInfo}
            />
          </Route>
        </Router>
        {/*
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
        */}
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
