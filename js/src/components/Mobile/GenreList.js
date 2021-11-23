import React, { useState, useCallback, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { GenreIndex } from './Index';
import { RowList } from './RowList';
import { ArtistList } from './ArtistList';
import { GenreImage } from './GenreImage';
import Link from './Link';

export const GenreList = ({
  controlAPI,
  adding,
  onAdd,
}) => {
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

  const rowRenderer = useCallback(({ key, index, style }) => {
    const genre = genres[index];
    return (
      <Link key={key} className="item" style={style} title={genre.name} to={`/genres/${genre.sort}`}>
        <GenreImage genre={genre} size={36} />
        <div className="title">{genre.name}</div>
      </Link>
    );
  }, [genres]);

  if (genres === null) {
    return null;
  }

  return (
    <RowList
      id="allgenres"
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
