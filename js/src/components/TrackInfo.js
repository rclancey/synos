import React from 'react';
import displayTime from '../lib/displayTime';

export const TrackInfo = ({ track }) => (
  <div className="trackInfo">
    <div className="title">{track.name}</div>
    <div className="artist">
      {track.artist}{' \u2014 '}{track.album}
    </div>
  </div>
);

export const TrackTime = ({ ms, ...props }) => (
  <div {...props}>{displayTime(ms)}</div>
);

