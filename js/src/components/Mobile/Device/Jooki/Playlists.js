import React, { useState, useCallback, useEffect, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useAPI } from '../../../../lib/useAPI';
import { JookiAPI } from '../../../../lib/jooki';
import { Icon } from '../../../Icon';
import { SongList, PlaylistTitle } from '../../SongList';
import { MixCover } from '../../../MixCover';
import { ScreenHeader } from '../../ScreenHeader';
import { JookiToken } from '../../../Jooki/Token';

export const Playlists = ({ db, controlAPI, onClose, onTrackMenu, onPlaylistMenu }) => {
  const [selected, setSelected] = useState(null);
  const onCloseMe = useCallback(() => setSelected(null), [setSelected]);
  const onOpen = setSelected;
  const playlists = useMemo(() => {
    return Object.entries(db.playlists).map(entry => {
      return Object.assign({}, { jooki_id: entry[0] }, entry[1]);
    })
      .sort((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
  }, [db]);
  if (selected) {
    return (
      <Playlist
        playlistId={selected.jooki_id}
        controlAPI={controlAPI}
        onClose={onCloseMe}
        onTrackMenu={onTrackMenu}
        onPlaylistMenu={onPlaylistMenu}
      />
    );
  }
  return (
    <div className="playlistList">
      <ScreenHeader
        name="Jooki Playlists"
        prev="Jooki"
        onClose={onClose}
      />
      <div className="items">
        { playlists.map(pl => (
          <div
            key={pl.jooki_id}
            className="item"
            onClick={() => onOpen(pl)}
          >
            { pl.star ? (
              <JookiToken starId={pl.star} size={36} />
            ) : (
              <Icon name="playlist" size={36} />
            ) }
            <div className="title">{pl.title}</div>
          </div>
        )) }
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
          overflow: auto;
        }
        .playlistList :global(.item) {
          display: flex;
          padding: 9px 0.5em 0px 0.5em;
          box-sizing: border-box;
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

export const Playlist = ({ playlistId, controlAPI, onClose, onTrackMenu, onPlaylistMenu }) => {
  const api = useAPI(JookiAPI);
  const [editing, setEditing] = useState(false);
  const [playlist, setPlaylist] = useState({ name: 'Loading...', tracks: [] });
  const onUpdatePlaylist = useCallback(() => {
    api.loadPlaylist(playlistId).then(setPlaylist);
  }, [api, playlistId, setPlaylist]);
  useEffect(() => {
    api.loadPlaylist(playlistId).then(setPlaylist);
  }, [api, playlistId, setPlaylist]);
  const onAdd = useCallback((track) => {
    console.debug('errant onAdd(%o)', track);
  }, []);
  const adding = false;
  return (
    <SongList
      api={api}
      prev="Jooki Playlists"
      tracks={playlist.tracks}
      playlist={playlist}
      withTrackNum={false}
      withCover={true}
      withArtist={true}
      withAlbum={false}
      editing={editing}
      adding={adding}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
      onPlaylistMenu={onPlaylistMenu}
      onAdd={onAdd}
      onUpdatePlaylist={onUpdatePlaylist}
    >
      { playlist.token ? (
        <JookiToken starId={playlist.token} size={140} />
      ) : (
        <MixCover tracks={playlist.tracks} radius={5} />
      ) }
      <PlaylistTitle
        tracks={playlist.tracks}
        playlist={playlist}
        editing={editing}
        adding={adding}
        onPlaylistMenu={onPlaylistMenu}
        onEditPlaylist={setEditing}
      />
    </SongList>
  );
};
