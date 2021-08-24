import React, { useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";
import { AutoSizeList } from '../AutoSizeList';
import { QueueHeader, QueueItem } from '../Queue';

export const Queue = ({ playMode, tracks, index, onSelect, onShuffle, onRepeat }) => {
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
          offset={0}
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
          background: var(--gradient);
        }
        .queue .items {
          height: calc(80vh - 33px);
          padding: 0 3px;
        }
      `}</style>
    </div>
  );
};
