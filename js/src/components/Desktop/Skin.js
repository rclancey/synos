import React, { useMemo, useState, useEffect, useContext } from 'react';
import { Controls } from './Controls';
import { Library } from './Library';
import { useTheme } from '../../lib/theme';

import 'react-virtualized/styles.css';
import 'react-sortable-tree/style.css';
//import '../../themes/desktop/layout.css';

const importedThemes = {};

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

  useEffect(() => {
    const handler = event => {
      console.debug('top level key down handler %o', event);
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
  console.debug('rendering desktop skin');

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
      <style jsx>{`
        #app {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: Tahoma;
          background-color: ${colors.background};
          color: ${colors.text};
        }
      `}</style>

    </div>
  );
};

export default DesktopSkin;
