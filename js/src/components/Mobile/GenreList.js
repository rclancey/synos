import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArtistList } from './ArtistList';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { GenreIndex } from './Index';
import { RowList } from './RowList';
import { GenreImage } from './GenreImage';

export const GenreList = ({
  prev,
  controlAPI,
  adding,
  onClose,
  onTrackMenu,
  onAdd,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState(null);
  const api = useAPI(API);
  useEffect(() => {
    api.genreIndex()
      .then(genres => {
        genres.forEach(genre => {
          genre.name = Object.keys(genre.names).sort((a, b) => genre.names[a] < genre.names[b] ? 1 : genre.names[a] > genre.names[b] ? -1 : 0)[0];
        });
        setGenres(genres);
      });
  }, []);

  const rowRenderer = useMemo(() => {
    return ({ key, index, style, onOpen }) => {
      const genre = genres[index];
      return (
        <div key={key} className="item" style={style} onClick={() => onOpen(genre)}>
          <GenreImage genre={genre} size={36} />
          <div className="title">{genre.name}</div>
        </div>
      );
    };
  }, [genres]);

  return (
    <RowList
      name="Genres"
      items={genres}
      selected={genre}
      Indexer={GenreIndex}
      indexerArgs={{ genres }}
      onSelect={setGenre}
      rowRenderer={rowRenderer}
      prev={prev}
      controlAPI={controlAPI}
      adding={adding}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
      Child={ArtistList}
      childArgs={{ genre }}
      onAdd={onAdd}
    />
  );
};
