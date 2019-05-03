import React, { useState } from 'react';
import { QueueItem } from '../Queue';

export const Queue = ({ buttonRef, queue, queueIndex, onSkipTo }) => {
  const [selected, setSelected] = useState(null);
  const rect = buttonRef.current.getBoundingClientRect();
  return (
    <div className="queue" style={{ left: `${rect.x}px`, top: `${rect.y}px` }}>
      { queue.slice(queueIndex+1).map((track, i) => (
        <QueueItem
          key={i}
          track={track}
          coverSize={44}
          coverRadius={3}
          selected={track.persistent_id === selected}
          onSelect={() => setSelected(track.persistent_id)}
          onPlay={() => onSkipTo(queueIndex + 1 + i)}
        />
      )) }
    </div>
  );
};
