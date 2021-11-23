import React from 'react';

import { useJooki } from '../../../../lib/jooki';
import { JookiTrackBrowser } from './TrackBrowser';

export const Playlist = ({ playlistId, setPlayer }) => {
  const { api, state, playlists } = useJooki();
  if (!playlistId || !playlists || !state) {
    return null;
  }
  const playlist = playlists.find((pl) => pl.persistent_id === playlistId);
  if (!playlist) {
    return null;
  }
  return (
    <JookiTrackBrowser api={api} playlist={playlist} setPlayer={setPlayer} />
  );
};

export default Playlist;
