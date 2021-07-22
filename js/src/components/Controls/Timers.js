import React from 'react';

import { TrackTime } from '../TrackInfo';

export const Timers = ({ currentTime, duration, ...props }) => (
  <div className="timer" {...props}>
    <TrackTime ms={currentTime} className="currentTime" />
    <div className="padding">{'\u00a0'}</div>
    <TrackTime ms={currentTime - duration} className="remainingTime" />
  </div>
);

export default Timers;
