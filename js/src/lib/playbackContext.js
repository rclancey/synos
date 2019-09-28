import React from 'react';

export const PlaybackContext = React.createContext({
  players: [],
  playlistId: null,
  queue: [],
  index: -1,
  playStatus: 'PAUSED',
  currentTime: 0,
  duration: 0,
  volume: 0,
  track: null,
});

