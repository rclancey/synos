import React, { useState, useCallback, useEffect } from 'react';
import { useStack } from './Router/StackContext';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { ArtistIndex } from './Index';
import { ArtistImage } from './ArtistImage';
import { AlbumList } from './AlbumList';
import { RowList } from './RowList';

export const ArtistList = ({
  genre,
  controlAPI,
  adding,
  onAdd,
}) => {
  const stack = useStack();
  const [artists, setArtists] = useState(null);
  const api = useAPI(API);
  useEffect(() => {
    api.artistIndex(genre)
      .then(artists => {
        artists.forEach(art => {
          art.name = Object.keys(art.names).sort((a, b) => art.names[a] < art.names[b] ? 1 : art.names[a] > art.names[b] ? -1 : 0)[0];
        });
        setArtists(artists);
      });
  }, [api, setArtists, genre]);

  const onPush = stack.onPush;
  const onOpen = useCallback((artist) => {
    onPush(artist.name, <AlbumList artist={artist} />);
  }, [onPush]);
  const rowRenderer = useCallback(({ key, index, style }) => {
    const artist = artists[index];
    return (
      <div key={key} className="item" style={style} onClick={() => onOpen(artist)}>
        <ArtistImage artist={artist} size={36} />
        <div className="title">{artist.name}</div>
      </div>
    );
  }, [artists, onOpen]);

  if (artists === null) {
    return null;
  }
  return (
    <RowList
      name={genre ? genre.name : "Artists"}
      items={artists}
      Indexer={ArtistIndex}
      indexerArgs={{ artists }}
      rowRenderer={rowRenderer}
      controlAPI={controlAPI}
      adding={adding}
      onAdd={onAdd}
    />
  );
};
