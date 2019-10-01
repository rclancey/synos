import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { QueueInfo, QueueItem } from '../Queue';
import { useTheme } from '../../lib/theme';

const Header = ({ tracks, onShuffle, onRepeat, onClose }) => {
  const colors = useTheme();
  return (
    <div className="header">
      <div className="title">Queue</div>
      <QueueInfo
        tracks={tracks}
        style={{
          flex: 10,
          fontSize: '10pt',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      />
      <div className="toggles">
        <div className="shuffle fas fa-random" onClick={onShuffle} />
        <div className="loop fas fa-recycle" onClick={onRepeat} />
        <div className="close fas fa-times" onClick={onClose} />
      </div>
      <style jsx>{`
        .header {
          display: flex;
          flex-direction: row;
          width: 100%;
          padding: 0.5em;
          position: fixed;
          color: ${colors.highlightText};
        }
        .header .title {
          flex: 1;
          font-size: 10pt;
          font-weight: bold;
          white-space: nowrap;
          margin-top: 0;
        }
        .header .toggles {
          flex: 1;
          display: flex;
          flex-direction: row;
          white-space: nowrap;
          margin-right: 0.5em;
        }
        .header .toggles>div {
          flex: 1;
          margin-right: 0.5em;
        }
      `}</style>
    </div>
  );
};

export const Queue = React.memo(({ tracks, index, onSelect, onClose }) => {
  const colors = useTheme();
  const selIdx = index;
  const curIdx = index;
  const rowRenderer = useMemo(() => {
    return ({ index, style }) => (
      <div style={style}>
        <QueueItem
          track={tracks[index]}
          coverSize={36}
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
      <Header tracks={tracks} onClose={onClose} />
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
          margin-top: 33px;
          height: calc(100vh - 33px);
          padding: 0 3px;
        }
      `}</style>
    </div>
  );
});
