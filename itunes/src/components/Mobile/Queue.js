import React from 'react';
import { QueueInfo, QueueItem } from '../Queue';

export const Queue = ({ tracks, index, onSelect, onClose }) => (
  <div className="queue">
    <div className="header">
      <div className="title">Queue</div>
      <QueueInfo tracks={tracks} />
      <div className="toggles">
        <div className="shuffle fas fa-random" />
        <div className="loop fas fa-recycle" />
        <div className="close fas fa-times" onClick={onClose} />
      </div>
    </div>
    <div className="items">
      { tracks.map((track, i) => (
        <QueueItem
          track={track}
          selected={i == index}
          current={i == index}
          onSelect={() => onSelect(track, i)}
        />
      )) }
    </div>
  </div>
);
