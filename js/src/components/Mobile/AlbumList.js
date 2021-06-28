import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useStack } from './Router/StackContext';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { AlbumIndex } from './Index';
import { CoverArt } from '../CoverArt';
import { CoverList } from './CoverList';
import { Album } from './SongList';

const albumImageUrl = (album, artist) => {
  let url = '/api/art/album?';
  if (album.artist) {
    url += `artist=${escape(album.artist.sort)}`;
  } else if (artist) {
    url += `artist=${escape(artist.sort)}`;
  }
  url += `&album=${escape(album.sort)}`;
  return url;
};

const AlbumImage = ({ album, artist, size }) => {
  const url = useMemo(() => albumImageUrl(album, artist), [album, artist]);
  return (
    <CoverArt url={url} size={size} radius={10} />
  );
};

export const AlbumList = ({
  artist,
  controlAPI,
  adding,
  onAdd,
}) => {
  const stack = useStack();
  const [albums, setAlbums] = useState(null);
  const api = useAPI(API);

  useEffect(() => {
    api.albumIndex(artist)
      .then(albums => {
        albums.forEach(album => {
          album.name = Object.entries(album.names)
            .sort((a, b) => a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0)[0][0];
          album.artist.name = Object.entries(album.artist.names)
            .sort((a, b) => a[1] > b[1] ? 1 : a[1] < b[1] ? -1 : 0)[0][0];
        });
        if (artist) {
          albums.sort((a, b) => a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0)
        }
        setAlbums(albums);
      });
  }, [api, artist]);

  const onPush = stack.onPush;
  const onOpen = useCallback((album) => {
    console.debug('open album %o', album);
    onPush(album.name, <Album album={album} />);
  }, [onPush]);
  const itemRenderer = useCallback(({ index }) => {
    const album = albums[index];
    if (!album) {
      return (<div className="item" />);
    }
    return (
      <div className="item" onClick={() => onOpen(album)}>
        <AlbumImage album={album} artist={artist} size={155} />
        <div className="title">{album.name}</div>
      </div>
    );
  }, [albums, artist, onOpen]);

  if (albums === null) {
    return null;
  }

  return (
    <CoverList
      name={artist ? artist.name : "Albums"}
      items={albums}
      Indexer={AlbumIndex}
      indexerArgs={{ albums, artist }}
      itemRenderer={itemRenderer}
      controlAPI={controlAPI}
      adding={adding}
      onAdd={onAdd}
    />
  );
};
