import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import cmp from '../../lib/cmp';
import displayName from '../../lib/displayName';
import { useHistoryState } from '../../lib/history';
import { AlbumIndex } from './Index';
import { CoverArt } from '../CoverArt';
import { CoverList } from './CoverList';
import { Album } from './SongList';
import Link from './Link';

const albumImageUrl = (album, artistName) => {
  let url = '/api/art/album?';
  if (album.artist) {
    url += `artist=${escape(album.artist.sort)}`;
  } else if (artistName) {
    url += `artist=${escape(artistName)}`;
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

export const AlbumContainer = () => {
  const match = useRouteMatch();
  const { albumName, artistName } = match.params || {};
  const album = useMemo(() => ({
    sort: albumName,
    artist: {
      sort: artistName,
    },
  }), [albumName, artistName]);
  return (
    <Album album={album} />
  );
};

export const AlbumList = ({
  controlAPI,
  adding,
  onAdd,
}) => {
  const match = useRouteMatch();
  const { artistName } = match.params;
  const { title } = useHistoryState();
  const [realTitle, setRealTitle] = useState(title || 'Albums');
  const [albums, setAlbums] = useState(null);
  const api = useAPI(API);

  useEffect(() => {
    if (!artistName) {
      setRealTitle('Albums');
    } else if (title) {
      setRealTitle(title);
    } else {
      api.getArtist(artistName).then((artist) => setRealTitle(displayName(artist)));
    }
  }, [api, artistName, title]);
  useEffect(() => {
    api.albumIndex(artistName)
      .then(albums => {
        albums.forEach(album => {
          displayName(album);
          displayName(album.artist);
        });
        if (artistName) {
          albums.sort((a, b) => cmp(a.sort, b.sort));
        }
        setAlbums(albums);
      });
  }, [api, artistName]);

  const itemRenderer = useCallback(({ index }) => {
    const album = albums[index];
    if (!album) {
      return (<div className="item" />);
    }
    return (
      <Link className="item" title={album.name} to={`/albums/${album.artist.sort}/${album.sort}`}>
        <AlbumImage album={album} artist={album.artist} size={155} />
        <div className="title">{album.name}</div>
      </Link>
    );
  }, [albums, artistName]);

  if (albums === null) {
    return null;
  }

  return (
    <CoverList
      name={realTitle}
      items={albums}
      Indexer={AlbumIndex}
      indexerArgs={{ albums, artistName }}
      itemRenderer={itemRenderer}
      controlAPI={controlAPI}
      adding={adding}
      onAdd={onAdd}
    />
  );
};
