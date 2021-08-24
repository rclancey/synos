import React from 'react';

import PlayButton from './PlayButton';
import PauseButton from './PauseButton';

export const PlayPauseButton = ({ size, paused, onPlay, onPause }) => {
  if (paused) {
    return (<PlayButton size={size} onPlay={onPlay} />);
  }
  return (<PauseButton size={size} onPause={onPause} />);
};

export default PlayPauseButton;
