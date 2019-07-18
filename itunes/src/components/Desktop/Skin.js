import React, { useState } from 'react';
import { Controls } from './Controls';
import { Library } from '../Library';

export const DesktopSkin = ({
  api,
  theme,
  status,
  queue,
  queueIndex,
  currentTime,
  duration,
  volume,
  sonos,
  onViewPlaylist,
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
  const [search, setSearch] = useState({});
  const [playlist, setPlaylist] = useState(null);
  //const [progress, setProgress] = useState({ complete: 0, total: 0 });
  const track = queue[queueIndex];
  return (
    <div id="app" className={`desktop ${theme}`}>
      <Controls
        status={status}
        queue={queue}
        queueIndex={queueIndex}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        sonos={sonos}
        search={search[playlist]}
        onPlay={onPlay}
        onPause={onPause}
        onSkipTo={onSkipTo}
        onSkipBy={onSkipBy}
        onSeekTo={onSeekTo}
        onSeekBy={onSeekBy}
        onSetVolumeTo={onSetVolumeTo}
        onEnableSonos={onEnableSonos}
        onDisableSonos={onDisableSonos}
        onSearch={(query) => { const s = Object.assign({}, search); s[playlist] = query; setSearch(s); }}
      />
      <Library 
        api={api}
        search={search[playlist]}
        currentTrack={track}
        onInsertIntoQueue={onInsertIntoQueue}
        onAppendToQueue={onAppendToQueue}
        onReplaceQueue={onReplaceQueue}
        onViewPlaylist={setPlaylist}
      />
      {/*
        onProgress={(complete, total) => setProgress({ complete, total: total || progress.total })}
      />
      <ProgressBar key="progress" total={progress.total} complete={progress.complete} />
      */}
    </div>
  );
};
