import React, { useState } from 'react';
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import { Controls } from './Controls';
import { Library } from '../Library';

import 'react-virtualized/styles.css';
import 'react-sortable-tree/style.css';
import '../../themes/desktop/layout.css';
//import '../../themes/desktop/light.css';
//import '../../themes/desktop/dark.css';
const importedThemes = {};

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
  if (importedThemes[theme] === undefined || importedThemes[theme] === null) {
    import(`../../themes/desktop/${theme}.css`);
  }
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
      <DragDropContextProvider backend={HTML5Backend}>
        <Library 
          api={api}
          search={search[playlist]}
          currentTrack={track}
          onInsertIntoQueue={onInsertIntoQueue}
          onAppendToQueue={onAppendToQueue}
          onReplaceQueue={onReplaceQueue}
          onViewPlaylist={setPlaylist}
        />
      </DragDropContextProvider>
      {/*
        onProgress={(complete, total) => setProgress({ complete, total: total || progress.total })}
      />
      <ProgressBar key="progress" total={progress.total} complete={progress.complete} />
      */}
    </div>
  );
};

export default DesktopSkin;
