import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { PLAYLIST_ORDER } from '../../lib/distinguished_kinds';
import { AutoSizeList } from '../AutoSizeList';
import { Icon } from '../Icon';
import { Playlist } from './SongList';
import { ScreenHeader } from './ScreenHeader';

export const PlaylistList = ({
  prev,
  adding,
  controlAPI,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
  onAdd,
}) => {
  const [scrollTop, setScrollTop] = useState([0]);
  const [path, setPath] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const api = useAPI(API);

  useEffect(() => {
    api.loadPlaylists()
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
      .then(setPlaylists);
  }, [api]);

  const onNewPlaylist = useCallback(console.debug, []);

  const onOpen = useCallback((pl) => {
    setScrollTop(orig => orig.concat([0]));
    setPath(orig => orig.concat([pl]));
  }, [setScrollTop, setPath]);

  const onCloseMe = useCallback(() => {
    if (path.length === 0) {
      onClose();
    } else {
      setScrollTop(orig => orig.slice(0, orig.length - 1));
      setPath(orig => orig.slice(0, orig.length - 1));
    }
  }, [path, setPath, setScrollTop, onClose]);

  const onScroll = useCallback(({ scrollOffset }) => {
    setScrollTop(orig => orig.slice(0, orig.length - 1).concat([scrollOffset]));
  }, [setScrollTop]);

  const folder = useMemo(() => {
    if (path.length === 0) {
      return playlists;
    }
    return path[path.length - 1].children || [];
  }, [path, playlists]);

  const rowRenderer = useCallback(({ key, index, style }) => {
    if (index >= folder.length) {
      return (
        <div
          key="new"
          className="item addPlaylist"
          style={style}
          onClick={() => onNewPlaylist(path.length === 0 ? null : path[path.length - 1])}
        >
          <Icon name="new-playlist" size={36} />
          <div className="title">New Playlist...</div>
        </div>
      );
    }
    const pl = folder[index];
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
  }, [folder, path, onOpen, onNewPlaylist]);

  let title = 'Playlists';
  let prevTitle = prev;
  if (path.length > 0) {
    prevTitle = 'Playlists';
    if (path.length > 1) {
      prevTitle = path[path.length - 2].name;
    }
    const pl = path[path.length - 1];
    if (pl.folder) {
      title = pl.name;
    } else {
      return (
        <Playlist
          playlist={pl}
          prev={prevTitle}
          adding={adding}
          onClose={onCloseMe}
          onTrackMenu={onTrackMenu}
          onPlaylistMenu={onPlaylistMenu}
          onAdd={onAdd}
        />
      );
    }
  }

  return (
    <div className="playlistList">
      <ScreenHeader
        name={title}
        prev={prevTitle}
        onClose={onCloseMe}
      />
      <div className="items">
        <AutoSizeList
          itemCount={folder.length + 1}
          itemSize={45}
          offset={0}
          initialScrollOffset={scrollTop[scrollTop.length - 1]}
          onScroll={onScroll}
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
