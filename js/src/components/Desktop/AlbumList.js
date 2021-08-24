import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { TH } from '../../lib/trackList';
import { CoverArt } from '../CoverArt';
import AlbumView from './Tracks/AlbumView';
import { ProgressBar } from './ProgressBar';

window.thier = TH;

const AlbumItem = ({ artist, album, onOpen, onClose }) => (
  <div className="album" onClick={() => onOpen(album)}>
    <CoverArt track={album.tracks[0]} size={160} radius={10} lazy />
    <div className="title">{album.name}</div>
    <div className="artist">{artist.name}</div>
  </div>
);

const ArtistItem = ({ artist, onOpen, onClose }) => artist.albums.map((album) => (
  <AlbumItem key={album.key} artist={artist} album={album} onOpen={onOpen} onClose={onClose} />
));

export const AlbumList = () => {
  const [artists, setArtists] = useState([]);
  const [album, setAlbum] = useState(null);
  const scroll = useRef(0);
  const onClose = useCallback(() => setAlbum(null), []);
  const onScroll = useCallback((evt) => {
    scroll.current = evt.target.scrollTop;
  }, []);
  const onRef = useCallback((node) => {
    if (node) {
      node.scrollTo(0, scroll.current);
    }
  }, []);
  useEffect(() => {
    if (album === null) {
      setTimeout(() => setArtists(TH.artists), 40);
    } else {
      setArtists([]);
    }
  }, [album]);
  if (album) {
    return <AlbumView album={album} onClose={onClose} />;
  }
  if (artists.length === 0) {
    return <ProgressBar total={100} complete={100} />;
  }
  return (
    <div ref={onRef} className="albums" onScroll={onScroll}>
      <style jsx>{`
        .albums {
          display: flex;
          flex-wrap: wrap;
          padding-left: 10px;
          padding-top: 10px;
          overflow: auto;
        }
        .albums :global(.album) {
          width: 160px;
          margin-right: 10px;
          margin-bottom: 10px;
          font-size: 10px;
        }
        .albums :global(.album .title) {
          font-weight: 500;
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 5px;
        }
        .albums :global(.album .artist) {
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
      { artists.map((artist) => (
        <ArtistItem key={artist.key} artist={artist} onOpen={setAlbum} onClose={onClose} />
      )) }
    </div>
  );
};

export default AlbumList;
