import React, { useState, useMemo, useEffect } from 'react';
import { AlbumList } from './AlbumList';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { ArtistIndex } from './Index';
import { ArtistImage } from './ArtistImage';
import { RowList } from './RowList';

export const ArtistList = ({
  prev,
  genre,
  controlAPI,
  adding,
  onClose,
  onTrackMenu,
  onAdd,
}) => {
  const [artists, setArtists] = useState([]);
  const [artist, setArtist] = useState(null);
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

  const rowRenderer = useMemo(() => {
    return ({ key, index, style, onOpen }) => {
      const artist = artists[index];
      return (
        <div key={key} className="item" style={style} onClick={() => onOpen(artist)}>
          <ArtistImage artist={artist} size={36} />
          <div className="title">{artist.name}</div>
        </div>
      );
    };
  }, [artists]);

  return (
    <RowList
      name={genre ? genre.name : "Artists"}
      items={artists}
      selected={artist}
      Indexer={ArtistIndex}
      indexerArgs={{ artists }}
      onSelect={setArtist}
      rowRenderer={rowRenderer}
      prev={prev}
      controlAPI={controlAPI}
      adding={adding}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
      Child={AlbumList}
      childArgs={{ artist }}
      onAdd={onAdd}
    />
  );
};
