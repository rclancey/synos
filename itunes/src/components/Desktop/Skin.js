import React, { useState } from 'react';
import { Controls } from './Controls';
import { Library } from '../Library';

export const DesktopSkin = ({
  status,
  queue,
  queueIndex,
  currentTime,
  duration,
  volume,
  sonos,
  onPlay,
  onPause,
  onInsertIntoQueue,
  onAppendToQueue,
  onReplaceQueue,
  onSkipTo,
  onSkipBy,
  onSeekTo,
  onSeekBy,
  onSetVolumeTo,
  onEnableSonos,
  onDisableSonos,
}) => {
  const [search, setSearch] = useState(null);
  const [progress, setProgress] = useState({ complete: 0, total: 0 });
  const track = queue[queueIndex];
  return (
    <div className="desktop">
      <Controls
        status={status}
        queue={queue}
        queueIndex={queueIndex}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        sonos={sonos}
        search={search}
        onPlay={onPlay}
        onPause={onPause}
        onSkipTo={onSkipTo}
        onSkipBy={onSkipBy}
        onSeekTo={onSeekTo}
        onSeekBy={onSeekBy}
        onSetVolumeTo={onSetVolumeTo}
        onEnableSonos={onEnableSonos}
        onDisableSonos={onDisableSonos}
        onSearch={setSearch}
      />
      <Library 
        search={search}
        currentTrack={track}
        onInsertIntoQueue={onInsertIntoQueue}
        onAppendToQueue={onAppendToQueue}
        onReplaceQueue={onReplaceQueue}
      />
      {/*
        onProgress={(complete, total) => setProgress({ complete, total: total || progress.total })}
      />
      <ProgressBar key="progress" total={progress.total} complete={progress.complete} />
      */}
    </div>
  );
};
