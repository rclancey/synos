import React, { useState } from 'react';
import { QueueItem } from '../Queue';
import { useTheme } from '../../lib/theme';

export const Queue = ({ queue, queueIndex, onSkipTo }) => {
  const colors = useTheme();
  const [selected, setSelected] = useState(null);
  return (
    <div className="queue">
      { queue.slice(queueIndex+1).map((track, i) => (
        <QueueItem
          key={i}
          track={track}
          coverSize={44}
          coverRadius={3}
          selected={track.persistent_id === selected}
          infoClassName="desktop"
          onSelect={() => setSelected(track.persistent_id)}
          onPlay={() => onSkipTo(queueIndex + 1 + i)}
        />
      )) }
      <style jsx>{`
        .queue {
          padding-top: 1em;
          padding-bottom: 1em;
          max-height: 80vh;
          overflow: auto;
          cursor: default;
          background-color: ${colors.background};
        }
        /*
        .queue :global(.trackInfo) {
          flex: 10;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-top-style: solid;
          border-top-width: 1px;
          padding-top: 5px;
          padding-right: 1em;
          margin-top: -2px;
        }
        */
        .queue :global(.item.selected .trackInfo),
        .queue :global(.item.selected .time),
          border-top: none;
        }
        /*
        .queue :global(.title) {
          font-size: 14px;
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .queue :global(.artist) {
          font-size: 12px;
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        */
        .queue :global(.time) {
          flex: 1;
          border-top-style: solid;
          border-top-width: 1px;
          font-size: 12px;
          padding-top: 14px;
          text-align: right;
          margin-top: -2px;
        }
      `}</style>
    </div>
  );
};
