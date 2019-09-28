import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
//import { List, AutoSizer } from "react-virtualized";
import { Album } from './SongList';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { ScreenHeader } from './ScreenHeader';
import { AlbumIndex } from './Index';
import { CoverArt } from '../CoverArt';
import { CoverList } from './CoverList';

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
  prev,
  artist,
  controlAPI,
  adding,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
  onAdd,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [albums, setAlbums] = useState([]);
  const [album, setAlbum] = useState(null);
  const ref = useRef(null);
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
  }, [artist]);
  const onOpen = useMemo(() => {
    return (album) => setAlbum(album);
  }, [setAlbum]);
  const onCloseMe = useMemo(() => {
    return () => {
      if (album === null) {
        onClose();
      } else {
        setAlbum(null);
      }
    };
  }, [album, onClose]);
  const onScroll = useMemo(() => {
    return ({ scrollOffset }) => setScrollTop(scrollOffset);
  });
  const itemRenderer = useMemo(() => {
    return ({ index, onOpen }) => {
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
    };
  }, [albums, artist]);

  if (album !== null) {
    console.debug('rendering album %o', album);
    return (
      <Album
        prev={artist || { name: "Albums"}}
        artist={artist || album.artist}
        album={album}
        adding={adding}
        onClose={onCloseMe}
        onTrackMenu={onTrackMenu}
        onPlaylistMenu={onPlaylistMenu}
        onAdd={onAdd}
      />
    );
  }
  return (
    <CoverList
      name={artist ? artist.name : "Albums"}
      items={albums}
      selected={album}
      Indexer={AlbumIndex}
      indexerArgs={{ albums, artist }}
      Child={Album}
      childArgs={{ album, artist: artist || (album ? album.artist : null) }}
      onSelect={setAlbum}
      itemRenderer={itemRenderer}
      prev={prev}
      controlAPI={controlAPI}
      adding={adding}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
      onAdd={onAdd}
    />
  );
};
