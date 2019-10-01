import React from 'react';

export const PlayerContext = React.createContext({
  onPlay: null,
  onPause: null,
  onSkipTo: null,
  onSkipBy: null,
  onSeekTo: null,
  onSeekBy: null,
  onReplaceQueue: null,
  onAppendToQueue: null,
  onInsertIntoQueue: null,
  onSetPlaylist: null,
  onSetVolumeTo: null,
  onChangeVolumeBy: null,
  onSetPlayer: null,
});
