import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { QueueHeader, QueueItem } from '../Queue';
import { useTheme } from '../../lib/theme';

export const Queue = React.memo(({ playMode, tracks, index, onSelect, onShuffle, onRepeat, onClose }) => {
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
          infoClassName="mobile"
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
        onClose={onClose}
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
          position: fixed;
          top: 0;
          left: 0;
          z-index: 3;
          width: 100vw;
          height: 100%;
          overflow: auto;
          background-color: ${colors.background};
        }
        .queue .items {
          height: calc(100vh - 33px);
          padding: 0 3px;
        }
      `}</style>
    </div>
  );
});
