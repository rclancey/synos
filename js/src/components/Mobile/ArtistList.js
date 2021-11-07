import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import displayName from '../../lib/displayName';
import { useHistoryState } from '../../lib/history';
import { ArtistIndex } from './Index';
import { ArtistImage } from './ArtistImage';
import { AlbumList } from './AlbumList';
import { RowList } from './RowList';
import Link from './Link';

export const ArtistList = ({
  controlAPI,
  adding,
  onAdd,
}) => {
  const match = useRouteMatch();
  const { genreName } = match.params;
  const { title } = useHistoryState();
  const [artists, setArtists] = useState(null);
  const api = useAPI(API);
  useEffect(() => {
    api.artistIndex(genreName)
      .then(artists => {
        artists.forEach(displayName);
        setArtists(artists);
      });
  }, [api, setArtists, genreName]);
  const id = useMemo(() => `artists-${genreName || 'allgenres'}`, [genreName]);

  const rowRenderer = useCallback(({ key, index, style }) => {
    const artist = artists[index];
    return (
      <Link key={key} className="item" style={style} to={`/artists/${artist.sort}`} title={artist.name}>
        <ArtistImage artist={artist} size={36} />
        <div className="title">{artist.name}</div>
      </Link>
    );
  }, [artists]);

  if (artists === null) {
    return null;
  }
  return (
    <RowList
      id={id}
      name={title || "Artists"}
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
