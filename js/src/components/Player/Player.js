import React from 'react';
import { LocalPlayer } from './LocalPlayer';
import { SonosPlayer } from './SonosPlayer';
import { JookiPlayer } from './JookiPlayer';

export const Player = ({
  player,
  setTiming,
  setPlaybackInfo,
  setControlAPI,
}) => {
  //console.debug('rendering player');
  if (player === 'local') {
    return (
      <LocalPlayer
        setTiming={setTiming}
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
    );
  }
  if (player === 'sonos') {
    return (
      <SonosPlayer
        setTiming={setTiming}
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
    );
  }
  if (player === 'jooki') {
    return (
      <JookiPlayer
        setTiming={setTiming}
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
    );
  }
  return (
    <LocalPlayer
      setTiming={setTiming}
      setPlaybackInfo={setPlaybackInfo}
      setControlAPI={setControlAPI}
    />
  );
};
