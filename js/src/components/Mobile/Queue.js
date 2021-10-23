import React, { useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { AutoSizeList } from '../AutoSizeList';
import { QueueHeader, QueueItem } from '../Queue';

export const Queue = React.memo(({ playMode, tracks, index, expanded, onSelect, onShuffle, onRepeat, onClose }) => {
  const selIdx = index;
  const curIdx = index;
  const rowRenderer = useCallback(({ index, style }) => (
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
  ), [tracks, selIdx, curIdx, onSelect]);
  if (!tracks) {
    return null;
  }
  return (
    <div className={`queue ${expanded ? 'open' : ''}`}>
      <QueueHeader
        playMode={playMode}
        tracks={tracks}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
        onClose={onClose}
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
          position: fixed;
          top: 0;
          left: 0;
          z-index: 3;
          width: 100vw;
          height: 0;
          overflow: auto;
          background: var(--gradient);
          transition-duration: 0.25s;
          transition-timing-function: ease;
          transition-property: height;
        }
        .queue.open {
          height: 100%;
        }
        .queue .items {
          height: calc(100vh - 33px);
          padding: 0 3px;
        }
      `}</style>
    </div>
  );
});
