import React from 'react';
import { LocalPlayer } from './LocalPlayer';
import { SonosPlayer } from './SonosPlayer';
import { JookiPlayer } from './JookiPlayer';

export const Player = ({
  player,
  setPlaybackInfo,
  setControlAPI,
}) => {
  //console.debug('rendering player');
  if (player === 'local') {
    return (
      <LocalPlayer
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
    );
  }
  if (player === 'sonos') {
    return (
      <SonosPlayer
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
    );
  }
  if (player === 'jooki') {
    return (
      <JookiPlayer
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
    );
  }
  return (
    <LocalPlayer
      setPlaybackInfo={setPlaybackInfo}
      setControlAPI={setControlAPI}
    />
  );
};
