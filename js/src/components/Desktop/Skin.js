import React, { useState, useEffect, useRef } from 'react';
import { Controls } from './Controls';
import { Library } from './Library';
import { ProgressBar } from './ProgressBar';
import { useTheme } from '../../lib/theme';
import { WS } from '../../lib/ws';

import 'react-sortable-tree/style.css';

export const DesktopSkin = ({
  theme,
  player,
  setPlayer,
  playbackInfo,
  controlAPI,
}) => {
  const colors = useTheme();
  const [search, setSearch] = useState({});
  const [playlist, setPlaylist] = useState(null);
  const [progress, setProgress] = useState(null);
  const progRef = useRef(progress);

  useEffect(() => {
    progRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const onMessage = msg => {
      if (msg.type === 'jooki_progress') {
        //console.debug(msg);
        const timestamp = Date.now();
        const total = msg.tracks.length;
        const complete = msg.tracks.reduce((p, tr) => p + (tr.upload_progress || 0), 0);
        const errs = msg.tracks.filter(tr => tr.error || false).length;
        const ids = msg.tracks.filter(tr => tr.jooki_id).length;
        console.debug('%o (%o) / %o => %o%', ids, complete, msg.tracks.length, 100 * complete / total);
        setProgress({ ...msg, total, complete, timestamp });
        if (errs !== 0 || (complete >= total && ids === msg.tracks.length)) {
          setTimeout(() => {
            if (progRef.current !== null && progRef.current.timestamp === timestamp) {
              setProgress(null);
            }
          }, 3000);
        }
      }
    };
    WS.on('message', onMessage);
    return () => {
      WS.off('message', onMessage);
    };
  }, []);

  useEffect(() => {
    const handler = event => {
      if (event.ctrlKey) {
        if (event.code === 'KeyF') {
          console.debug('activate search');
        } else if (event.code === 'KeyN') {
          if (event.shiftKey) {
            console.debug('new playlist folder');
          } else if (event.altKey) {
            console.debug('new smart playlist');
          } else {
            console.debug('new playlist');
          }
        } else if (event.code === 'KeyG') {
          console.debug('new genius playlist');
        }
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, []);

  return (
    <div id="app" className={`desktop ${theme}`}>
      <Controls
        search={search[playlist]}
        playbackInfo={playbackInfo}
        controlAPI={controlAPI}
        setPlayer={setPlayer}
        onSearch={(query) => setSearch({}, search, { [playlist]: query })}
      />
      <Library 
        playlist={playlist}
        track={playbackInfo && playbackInfo.queue ? playbackInfo.queue[playbackInfo.index] : null}
        search={search[playlist]}
        controlAPI={controlAPI}
        setPlaylist={setPlaylist}
      />
      { progress !== null ? (
        <ProgressBar total={progress.total} complete={progress.complete} />
      ) : null }
      <style jsx>{`
        #app {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: ${colors.background};
          color: ${colors.text};
        }
      `}</style>

    </div>
  );
};

export default DesktopSkin;
