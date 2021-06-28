import React, { useState, useCallback, useEffect } from 'react';
import { useStack } from './Router/StackContext';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { PLAYLIST_ORDER } from '../../lib/distinguished_kinds';
import { AutoSizeList } from '../AutoSizeList';
import { Icon } from '../Icon';
import { Playlist } from './SongList';
import { ScreenHeader } from './ScreenHeader';

export const PlaylistWrapper = ({ persistent_id }) => {
  return null;
};

export const PlaylistFolder = ({ persistent_id }) => {
  const stack = useStack();
  const [playlist, setPlaylist] = useState({ name: 'Playlists' });
  const [playlists, setPlaylists] = useState([]);
  const api = useAPI(API);

  useEffect(() => {
    console.debug('history.pushState');
    window.history.pushState({ persistent_id }, 'playlist folder', `/${persistent_id}`);
    if (persistent_id) {
      api.loadPlaylist(persistent_id).then(setPlaylist);
    } else {
      setPlaylist({ name: 'Playlists' });
    }
  }, [api, persistent_id]);
  useEffect(() => {
    api.loadPlaylists(persistent_id)
      .then(playlists => playlists.filter(pl => {
        const o = PLAYLIST_ORDER[pl.kind];
        if (o === null || o === undefined) {
          return true;
        }
        if (o >= 100) {
          return true;
        }
        return false;
      }))
      .then(pls => {
        setPlaylists(pls);
        /*
        let l = pls;
        if (forcePath) {
          forcePath.every(id => {
            if (!l) {
              return false;
            }
            const pl = l.find(x => x.persistent_id === id);
            if (pl) {
              onOpen(pl);
              l = pl.children;
              return true;
            }
            return false;
          });
        }
        */
      });
  }, [api, persistent_id]);//, forcePath, onOpen]);
  /*
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);
  */

  const onPush = stack.onPush;
  const onOpen = useCallback((pl) => {
    console.debug('onOpen(%o)', pl);
    if (pl.folder) {
      onPush(pl.name, <PlaylistFolder persistent_id={pl.persistent_id} />);
    } else {
      onPush(pl.name, <Playlist playlist={pl} />);
    }
  }, [onPush]);

  const onNewPlaylist = useCallback(() => {
    const playlist = {
      parent_persistent_id: persistent_id,
      kind: 'standard',
      name: 'Untitled Playilst',
      track_ids: [],
    };
    console.debug('createPlaylist(%o)', playlist);
    api.createPlaylist(playlist).then(onOpen);
  }, [api, persistent_id, onOpen]);

  const rowRenderer = useCallback(({ key, index, style }) => {
    if (index >= playlists.length) {
      return (
        <div
          key="new"
          className="item addPlaylist"
          style={style}
          onClick={onNewPlaylist}
        >
          <Icon name="new-playlist" size={36} />
          <div className="title">New Playlist...</div>
        </div>
      );
    }
    const pl = playlists[index];
    return (
      <div
        key={pl.persistent_id}
        className="item"
        style={style}
        onClick={() => onOpen(pl)}
      >
        <Icon name={pl.kind} size={36} />
        <div className="title">{pl.name}</div>
      </div>
    );
  }, [playlists, onOpen, onNewPlaylist]);

  return (
    <div className="playlistList">
      <ScreenHeader name={playlist.name} />
      <div className="items">
        <AutoSizeList
          xkey={playlist.persistent_id}
          itemCount={playlists.length + 1}
          itemSize={45}
          offset={0}
          initialScrollOffset={stack.pages[stack.pages.length - 1].scrollOffset}
          onScroll={stack.onScroll}
        >
          {rowRenderer}
        </AutoSizeList>
      </div>
      <style jsx>{`
        .playlistList {
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          overflow: hidden;
        }
        .playlistList .items {
          height: calc(100vh - 185px);
        }
        .playlistList :global(.item) {
          display: flex;
          padding: 9px 0.5em 0px 0.5em;
          box-sizing: border-box;
        }
        .playlistList .item .icon {
          flex: 1;
          width: 36px;
          min-width: 36px;
          max-width: 36px;
          height: 36px;
          box-sizing: border-box;
          background-size: cover;
          opacity: 0.75;
        }
        .playlistList :global(.item .title) {
          flex: 10;
          font-size: 18px;
          line-height: 36px;
          padding-left: 0.5em;
        }
      `}</style>
    </div>
  );
};
