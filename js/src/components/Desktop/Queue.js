import React, { useMemo, useState, useEffect } from 'react';
import _JSXStyle from "styled-jsx/style";
import { AutoSizeList } from '../AutoSizeList';
import { QueueHeader, QueueItem } from '../Queue';

export const Queue = ({ playMode, tracks, index, onSelect, onShuffle, onRepeat }) => {
  const [className, setClassName] = useState('init');
  useEffect(() => setClassName('open'), []);
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
    <div className={`queue ${className}`}>
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
          overflow: auto;
          cursor: default;
          background: var(--gradient);
          transition: opacity 0.2s linear, max-height 0.1s ease;
        }
        .queue.init {
          opacity: 0;
          max-height: 0vh;
        }
        .queue.open {
          opacity: 1;
          max-height: 80vh;
        }
        .queue .items {
          height: calc(80vh - 33px);
          padding: 0 3px;
        }
      `}</style>
    </div>
  );
};
