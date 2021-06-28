import React, { useState, useCallback, useEffect } from 'react';
import { useStack } from './Router/StackContext';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { GenreIndex } from './Index';
import { RowList } from './RowList';
import { ArtistList } from './ArtistList';
import { GenreImage } from './GenreImage';

export const GenreList = ({
  controlAPI,
  adding,
  onAdd,
}) => {
  const stack = useStack();
  const [genres, setGenres] = useState(null);
  const api = useAPI(API);
  useEffect(() => {
    api.genreIndex()
      .then(genres => {
        genres.forEach(genre => {
          genre.name = Object.keys(genre.names).sort((a, b) => genre.names[a] < genre.names[b] ? 1 : genre.names[a] > genre.names[b] ? -1 : 0)[0];
        });
        setGenres(genres);
      });
  }, [api, setGenres]);

  const onPush = stack.onPush;
  const onOpen = useCallback((genre) => {
    onPush(genre.name, <ArtistList genre={genre} />);
  }, [onPush]);
  const rowRenderer = useCallback(({ key, index, style }) => {
    const genre = genres[index];
    return (
      <div key={key} className="item" style={style} onClick={() => onOpen(genre)}>
        <GenreImage genre={genre} size={36} />
        <div className="title">{genre.name}</div>
      </div>
    );
  }, [genres, onOpen]);

  if (genres === null) {
    return null;
  }

  return (
    <RowList
      name="Genres"
      items={genres}
      Indexer={GenreIndex}
      indexerArgs={{ genres }}
      rowRenderer={rowRenderer}
      controlAPI={controlAPI}
      adding={adding}
      onAdd={onAdd}
    />
  );
};
