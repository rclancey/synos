import React, { useState, useEffect, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { useAPI } from '../../lib/useAPI';
import { API } from '../../lib/api';
import { CoverList } from './CoverList';
import { CoverArt } from '../CoverArt';
import { MixCover } from '../MixCover';
import { Album, Playlist } from './SongList';
import Link from './Link';

export const RecentAdditions = ({
  controlAPI,
  adding,
  onAdd,
}) => {
  const api = useAPI(API);
  const [recents, setRecents] = useState([]);
  useEffect(() => {
    api.loadRecent().then((rows) => setRecents(rows.filter((row) => row.type !== 'track')));
    /*
    api.loadTrackCount(0)
      .then(count => api.loadTracks(1, count, 0, { date_added: Date.now() - (366 * 86400 * 1000) }))
      .then(tracks => {
        tracks.sort((a, b) => {
          return a.date_added < b.date_added ? 1 : a.date_added > b.date_added ? -1 : 0;
        });
        setRecents(tracks);
      });
    */
  }, [api, setRecents]);

  const itemRenderer = useCallback(({ index }) => {
    const item = recents[index];
    if (!item) {
      return <div className="item" />;
    }
    switch (item.type) {
      case 'album':
        const album = item.album;
        return (
          <Link className="item" title={album.name} to={`/albums/${album.artist}/${album.album}`}>
            <CoverArt track={item.album.tracks[0]} size={155} radius={10} />
            <div className="title">{album.tracks.length === 1 ? album.tracks[0].name : album.album}</div>
            <div className="artist">{album.tracks.length === 1 ? album.tracks[0].artist : album.artist}</div>
          </Link>
        );
      case 'playlist':
        const playlist = item.playlist;
        return (
          <Link className="item" title={playlist.name} to={`/playlists/${playlist.persistent_id}`}>
            <MixCover tracks={playlist.items} size={155} radius={10} />
            <div className="title">{playlist.name}</div>
            <div className="artist">{'\u00a0'}</div>
          </Link>
        );
      default:
        return null;
    }
  }, [recents]);
  if (!recents || recents.length === 0) {
    return null;
  }

  return (
    <CoverList
      id="recently-added"
      name="Recently Added"
      height={215}
      items={recents}
      itemRenderer={itemRenderer}
      controlAPI={controlAPI}
      adding={adding}
      onAdd={onAdd}
    />
  );
};
