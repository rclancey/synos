import React, { useMemo, useState, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { TH } from '../../lib/trackList';
import { usePlaybackInfo, useControlAPI } from '../Player/Context';
import AlbumView from './Tracks/AlbumView';

export const AlbumContainer = () => {
  const [thUpdate, setThUpdate] = useState(0);
  useEffect(() => {
    const callback = () => setThUpdate((orig) => orig + 1);
    TH.on('update', callback);
    return () => {
      TH.off('update', callback);
    };
  }, []);
  const { params } = useRouteMatch();
  const { artistName, albumName } = params;
  const artist = useMemo(() => {
    const index = TH.index[artistName];
    if (index === null || index === undefined) {
      console.debug('no artist %o in %o', artistName, TH.index);
      return null;
    }
    return TH.artists[index] || null;
  }, [artistName, thUpdate]);
  const album = useMemo(() => {
    if (!artist) {
      return null;
    }
    const index = artist.albumIndex[albumName];
    if (index === null || index === undefined) {
      console.debug('no album %o in %o', albumName, artist.albumIndex);
      return null;
    }
    return artist.albums[index] || null;
  }, [artist, albumName, thUpdate]);
  const playback = usePlaybackInfo();
  const controlAPI = useControlAPI();
  if (!album) {
    return null;
  }
  return (
    <AlbumView
      artist={artist}
      album={album} 
      playback={playback}
      controlAPI={controlAPI}
    />
  );
};

export default AlbumContainer;
