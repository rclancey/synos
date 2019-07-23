import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { QueueInfo, QueueItem } from '../Queue';

export const Queue = ({ tracks, index, onSelect, onClose }) => {
  const selIdx = index;
  const curIdx = index;
  const rowRenderer = ({ index, style }) => (
    <div style={style}>
      <QueueItem
        track={tracks[index]}
        selected={index === selIdx}
        current={index === curIdx}
        onSelect={() => onSelect(tracks[index], index)}
      />
    </div>
  );
  return (
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
        <AutoSizer>
          {({width, height}) => (
            <List
              width={width}
              height={height}
              itemCount={tracks.length}
              itemSize={50}
              overscanCount={Math.ceil(height / 50)}
              initialScrollOffset={Math.max(0, index - 2) * 50}
            >
              {rowRenderer}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};
