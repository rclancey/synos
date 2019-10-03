import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { QueueHeader, QueueItem } from '../Queue';
import { useTheme } from '../../lib/theme';

export const Queue = ({ playMode, tracks, index, onSelect, onShuffle, onRepeat }) => {
  const colors = useTheme();
  const selIdx = index;
  const curIdx = index;
  const rowRenderer = useMemo(() => {
    return ({ index, style }) => (
      <div style={style}>
        <QueueItem
          track={tracks[index]}
          coverSize={44}
          selected={index === selIdx}
          current={index === curIdx}
          infoClassName="desktop"
          onPlay={() => onSelect(tracks[index], index)}
        />
      </div>
    );
  }, [tracks, selIdx, curIdx, onSelect]);
  return (
    <div className="queue">
      <QueueHeader
        playMode={playMode}
        tracks={tracks}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
      />
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
      <style jsx>{`
        .queue {
          max-height: 80vh;
          overflow: auto;
          cursor: default;
          background-color: ${colors.background};
        }
        .queue .items {
          height: calc(80vh - 33px);
          padding: 0 3px;
        }
        /*
        .queue :global(.time) {
          flex: 1;
          border-top-style: solid;
          border-top-width: 1px;
          font-size: 12px;
          padding-top: 14px;
          text-align: right;
          margin-top: -2px;
        }
        */
      `}</style>
    </div>
  );
};
