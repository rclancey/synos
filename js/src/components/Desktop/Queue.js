import React, { useMemo } from 'react';
import { AutoSizeList } from '../AutoSizeList';
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
        <AutoSizeList
          itemCount={tracks.length}
          itemSize={50}
          initialScrollOffset={Math.max(0, index - 2) * 50}
        >
          {rowRenderer}
        </AutoSizeList>
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
      `}</style>
    </div>
  );
};
