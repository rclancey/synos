import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import useMeasure from 'react-use-measure';
import { Link } from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { AutoSizeList } from '../AutoSizeList';
import { CoverArt } from '../CoverArt';
import { MixCover } from '../MixCover';
import AlbumView from './Tracks/AlbumView';
import PlaylistView from './Tracks/PlaylistView';

const autoSizerStyle = { overflow: 'overlay' };

const recentItemKey = (item) => {
  switch (item.type) {
    case 'playlist':
      return item.playlist.persistent_id;
    case 'track':
      return item.track.persistent_id;
    case 'album':
      return `album-${item.album.tracks[0].persistent_id}`;
    default:
      return `${item.type}-${item.date_added}`;
  }
};

const RecentPlaylist = ({ playlist }) => (
  <div className="playlist item">
    <Link to={`/playlists/${playlist.persistent_id}`}>
      <MixCover tracks={playlist.items} size={160} radius={10} />
      <div className="title">{playlist.name}</div>
    </Link>
  </div>
);

const RecentTrack = ({ track }) => (
  <div className="track item">
    <CoverArt track={track} size={160} radius={10} />
    <div className="title">{track.name}</div>
    <div className="artist">{track.artist}</div>
  </div>
);
    
const RecentAlbum = ({ album }) => (
  <div className="album item">
    <Link to={`/albums/${album.tracks[0].sort_artist}/${album.tracks[0].sort_album}`}>
      <CoverArt track={album.tracks[0]} size={160} radius={10} />
      <div className="title">{album.tracks.length === 1 ? album.tracks[0].name : album.album}</div>
      <div className="artist">{album.tracks.length === 1 ? album.tracks[0].artist : album.artist}</div>
    </Link>
  </div>
);

const RecentItem = ({ item, onOpenAlbum, onOpenPlaylist }) => {
  switch (item.type) {
    case 'playlist':
      return <RecentPlaylist playlist={item.playlist} onOpen={onOpenPlaylist} />;
    case 'track':
      return null;
      //return <RecentTrack track={item.track} />;
    case 'album':
      return <RecentAlbum album={item.album} onOpen={onOpenAlbum} />;
    default:
      return null;
  }
};

const cache = [null];

export const Recents = ({}) => {
  const [recent, setRecent] = useState(cache[0]);
  /*
  const [album, setAlbum] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const onClose = useCallback(() => {
    setAlbum(null);
    setPlaylist(null);
  }, []);
  */
  const api = useAPI(API);
  useEffect(() => {
    api.loadRecent().then(setRecent);
  }, [api]);
  useEffect(() => {
    cache[0] = recent;
  }, [recent]);
  const [ref, bounds] = useMeasure();
  const n = useMemo(() => Math.max(1, Math.floor((bounds.width - 20) / 170)), [bounds.width]);
  const rowRenderer = useCallback(({ index, style }) => (
    <div className="row" style={style}>
      {recent.slice(index * n, (index + 1) * n).map((item) => (
        <RecentItem
          key={recentItemKey(item)}
          item={item}
        />
      ))}
    </div>
  ), [recent, n]);
    
  /*
  if (album) {
    return <AlbumView album={album} onClose={onClose} />;
  }
  if (playlist) {
    return <PlaylistView playlist={playlist} onClose={onClose} />;
  }
  */
  if (recent === null) {
    return null;
  }
  return (
    <div ref={ref} className="recents">
      <style jsx>{`
        .recents {
          /*
          display: flex;
          flex-wrap: wrap;
          */
          padding-left: 10px;
          padding-top: 10px;
          overflow: overlay;
          width: 100%;
          box-sizing: border-box;
        }
        .recents :global(.row) {
          display: flex;
        }
        .recents :global(.item) {
          width: 160px;
          margin-right: 10px;
          margin-bottom: 10px;
          font-size: 10px;
        }
        .recents :global(.item .title) {
          font-weight: 500;
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 5px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .recents :global(.item .artist) {
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
      <AutoSizeList
        id="recents"
        itemCount={Math.ceil(recent.length / n)}
        itemSize={200}
        offset={0}
        style={autoSizerStyle}
      >
        {rowRenderer}
      </AutoSizeList>
      {/*
      { recent.map((item) => (
        <RecentItem
          key={recentItemKey(item)}
          item={item}
          onOpenAlbum={setAlbum}
          onOpenPlaylist={setPlaylist}
        />)) }
      */}
    </div>
  );
};

export default Recents;
