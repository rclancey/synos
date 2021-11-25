import React, { useState, useEffect, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useRouteMatch, useHistory } from 'react-router-dom';

import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import { TH } from '../../../lib/trackList';
import { PlaylistContainer } from './PlaylistContainer';

export const ArtistMix = ({
  search,
  controlAPI,
  onShowInfo,
  onShowMultiInfo,
}) => {
  const api = useAPI(API);
  const { params } = useRouteMatch();
  const { artistName } = params;
  const { location } = useHistory();
  const { state } = location;
  const [artist, setArtist] = useState(null);
  useEffect(() => {
    const callback = () => {
      const index = TH.index[artistName];
      if (index !== null && index !== undefined) {
        setArtist(TH.artists[index]);
      }
    };
    TH.on('update', callback);
    return () => {
      TH.off('update', callback);
    };
  }, []);
  const getPlaylist = useCallback(() => {
    if (state && state.playlist) {
      return Promise.resolve(state.playlist);
    }
    if (!artist) {
      return Promise.resolve(null);
    }
    return api.makeArtistMix(artist.name, { maxArtists: 25, maxTracksPerArtist: 5 });
  }, [api, artist, state]);
  return (
    <PlaylistContainer
      search={search}
      getPlaylist={getPlaylist}
      controlAPI={controlAPI}
      onShowInfo={onShowInfo}
      onShowMultiInfo={onShowMultiInfo}
    />
  );
};

export default ArtistMix;
