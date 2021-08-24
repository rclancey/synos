import React, { useRef, useState, useEffect, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
/*
import Button from '../../Input/Button';
import MenuInput from '../../Input/MenuInput';
import TextInput from '../../Input/TextInput';
import DateInput from '../../Input/DateInput';
import TimeInput from '../../Input/TimeInput';
import IntegerInput from '../../Input/IntegerInput';
import StarInput from '../../Input/StarInput';
//import DurationInput from '../../Input/DurationInput';
*/
import { CoverArt } from '../CoverArt';
import { MixCover } from '../MixCover';
import AlbumView from './Tracks/AlbumView';
import PlaylistView from './Tracks/PlaylistView';

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

const RecentPlaylist = ({ playlist, onOpen }) => (
  <div className="playlist item" onClick={() => onOpen(playlist)}>
    <MixCover tracks={playlist.items} size={160} radius={10} lazy />
    <div className="title">{playlist.name}</div>
  </div>
);

const RecentTrack = ({ track }) => (
  <div className="track item">
    <CoverArt track={track} size={160} radius={10} lazy />
    <div className="title">{track.name}</div>
    <div className="artist">{track.artist}</div>
  </div>
);
    
const RecentAlbum = ({ album, onOpen }) => (
  <div className="album item" onClick={() => onOpen(album)}>
    <CoverArt track={album.tracks[0]} size={160} radius={10} lazy />
    <div className="title">{album.tracks.length === 1 ? album.tracks[0].name : album.album}</div>
    <div className="artist">{album.tracks.length === 1 ? album.tracks[0].artist : album.artist}</div>
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

export const Recents = ({}) => {
  const [recent, setRecent] = useState([]);
  const [album, setAlbum] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const scroll = useRef(0);
  const onScroll = useCallback((evt) => {
    scroll.current = evt.target.scrollTop;
  }, []);
  const onRef = useCallback((node) => {
    if (node) {
      node.scrollTo(0, scroll.current);
    }
  }, []);
  const onClose = useCallback(() => {
    setAlbum(null);
    setPlaylist(null);
  }, []);
  const api = useAPI(API);
  useEffect(() => {
    api.loadRecent().then(setRecent);
  }, [api]);
  if (album) {
    return <AlbumView album={album} onClose={onClose} />;
  }
  if (playlist) {
    return <PlaylistView playlist={playlist} onClose={onClose} />;
  }
  return (
    <div ref={onRef} className="recents" onScroll={onScroll}>
      <style jsx>{`
        .recents {
          display: flex;
          flex-wrap: wrap;
          padding-left: 10px;
          padding-top: 10px;
          overflow: auto;
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
        }
        .recents :global(.item .artist) {
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
      { recent.map((item) => (
        <RecentItem
          key={recentItemKey(item)}
          item={item}
          onOpenAlbum={setAlbum}
          onOpenPlaylist={setPlaylist}
        />)) }
    </div>
  );
};

export default Recents;
