import React, { useMemo, useState, useReducer, useEffect } from 'react';
import { useDarkMode, useMobile, usePWA } from '../lib/useMedia';
import { ThemeContext } from '../lib/theme';
import { loadTheme } from '../lib/loadTheme';
import { CheckLogin } from './Login';
import { Player } from './Player/Player';
import { MobileSkin } from './Mobile/Skin';
import { DesktopSkin } from './Desktop/Skin';

const InstallAppButton = ({ onInstall }) => (
  <div className="installApp" onClick={onInstall}>
    install me
  </div>
);

const initState = () => {
  const saved = window.localStorage.getItem('outputDevice');
  return saved || 'local';
};

const saveState = state => {
  window.localStorage.setItem('outputDevice', state);
  return state;
};

const reducer = (state, action) => {
  switch (action.type) {
  case 'set':
    return saveState(action.value || 'local');
  }
  return state;
};

export const Main = () => {
  const [player, dispatch] = useReducer(reducer, null, initState);
  const [playbackInfo, setPlaybackInfo] = useState({});
  const [controlAPI, setControlAPI] = useState({});
  const standalone = usePWA();
  const mobile = useMobile();
  const dark = useDarkMode();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const setPlayer = useMemo(() => {
    return (value) => dispatch({ type: 'set', value });
  }, dispatch);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.beforeInstallPrompt.then(evt => {
        setInstallPrompt(evt);
      });
      window.addEventListener('appinstalled', evt => {
        console.debug('app installed: %o', evt);
      });
    }
  }, []);

  const onInstall = () => {
    const evt = installPrompt;
    if (!evt) {
      return;
    }
    evt.prompt();
    evt.userChoice.then(res => {
      if (res.outcome === 'accepted') {
        console.debug('install accepted');
      } else {
        console.debug('install declined');
      }
      setInstallPrompt(null);
    });
  };

  /*
  useEffect(() => {
    loadTheme(`${mobile ? 'mobile' : 'desktop'}/layout`);
    loadTheme(`common/${dark ? 'dark' : 'light'}`);
    loadTheme(`${mobile ? 'mobile' : 'desktop'}/${dark ? 'dark' : 'light'}`);
  }, [dark, mobile]);
  */

  const theme = dark ? 'dark' : 'light';

  return (
    <div className="App">
      { installPrompt ? (
        <InstallAppButton onInstall={onInstall} />
      ) : null }
      <ThemeContext.Provider value={theme}>
        <CheckLogin mobile={mobile}>
          <Player
            player={player}
            setPlayer={setPlayer}
            setPlaybackInfo={setPlaybackInfo}
            setControlAPI={setControlAPI}
          />
          { mobile ? (
            <MobileSkin
              theme={theme}
              player={player}
              playbackInfo={playbackInfo}
              controlAPI={controlAPI}
              setPlayer={setPlayer}
            />
          ) : (
            <DesktopSkin
              theme={theme}
              player={player}
              playbackInfo={playbackInfo}
              controlAPI={controlAPI}
              setPlayer={setPlayer}
            />
          ) }
        </CheckLogin>
      </ThemeContext.Provider>
    </div>
  );
};

