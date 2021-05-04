import React, { useMemo, useContext } from 'react';

export const PlayerStateContext = React.createContext({
  player: 'none',
  playlistId: null,
  queue: [],
  queueOrder: [],
  index: -1,
  playStatus: 'PAUSED',
  volume: 20,
  playMode: 0,
});

export const PlayerTimingContext = React.createContext({
  currentTime: 0,
  duration: 0,
});

export const PlayerControlContext = React.createContext({
  onPlay: () => Promise.resolve(),
  onPause: () => Promise.resolve(),
  onSkipTo: (index) => Promise.resolve(),
  onSkipBy: (count) => Promise.resolve(),
  onSeekTo: (ms) => Promise.resolve(),
  onSeekBy: (deltaMs) => Promise.resolve(),
  onReplaceQueue: (tracks) => Promise.resolve(),
  onAppendToQueue: (tracks) => Promise.resolve(),
  onInsertIntoQueue: (tracks) => Promise.resolve(),
  onSetPlaylist: (playlistId, index) => Promise.resolve(),
  onSetVolumeTo: (volume) => Promise.resolve(),
  onChangeVolumeBy: (delta) => Promise.resolve(),
  onShuffle: () => Promise.resolve(),
  onRepeat: () => Promise.resolve(),
});

export const usePlaybackInfo = () => {
  return useContext(PlayerStateContext);
};

export const usePlaybackTiming = () => {
  return useContext(PlayerTimingContext);
};

export const useControlAPI = () => {
  return useContext(PlayerControlContext);
};

export const currentTrack = (playbackInfo) => {
  if (!playbackInfo.queue) {
    return {};
  }
  if (playbackInfo.index < 0 || playbackInfo.index >= playbackInfo.queue.length) {
    return {};
  }
  if (playbackInfo.queueOrder && playbackInfo.queueOrder.length === playbackInfo.queue.length) {
    const idx = playbackInfo.queueOrder[playbackInfo.index];
    return playbackInfo.queue[idx];
  }
  return playbackInfo.queue[playbackInfo.index];
};

export const useCurrentTrack = () => {
  const playbackInfo = usePlaybackInfo();
  const track = useMemo(() => currentTrack(playbackInfo), [playbackInfo]);
  return track;
};

