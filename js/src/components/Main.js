import React, { Suspense, useMemo, useState, useReducer, useEffect } from 'react';
import { useDarkMode, useMobile } from '../lib/useMedia';
import { ThemeContext } from '../lib/theme';
import { CheckLogin } from './Login';
import { PlayerControlContext, PlayerStateContext } from './Player/Context';

const DesktopSkin = React.lazy(() => import('./Desktop/Skin'));
const MobileSkin = React.lazy(() => import('./Mobile/Skin'));

const InstallAppButton = ({ onInstall }) => (
  <div className="installApp" onClick={onInstall}>
    install me
  </div>
);

const initState = () => {
  const saved = window.localStorage.getItem('outputDevice');
  switch (saved) {
  case 'sonos':
    return saved;
  default:
    return 'local';
  }
};

const saveState = state => {
  window.localStorage.setItem('outputDevice', state);
  return state;
};

const reducer = (state, action) => {
  switch (action.type) {
  case 'set':
    return saveState(action.value || 'local');
  default:
    console.error("unhandled action: %o", action);
  }
  return state;
};

export const Main = () => {
  const [player, dispatch] = useReducer(reducer, null, initState);
  const [playbackInfo, setPlaybackInfo] = useState({});
  const [controlAPI, setControlAPI] = useState({});
  const mobile = useMobile();
  const dark = useDarkMode();
  const [installPrompt, setInstallPrompt] = useState(null);
  const setPlayer = useMemo(() => {
    return (value) => dispatch({ type: 'set', value });
  }, [dispatch]);

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

  const theme = dark ? 'dark' : 'light';

  return (
    <div className="App">
      { installPrompt ? (
        <InstallAppButton onInstall={onInstall} />
      ) : null }
      <ThemeContext.Provider value={theme}>
        <CheckLogin>
          {/*
          <Player
            player={player}
            setPlayer={setPlayer}
            setTiming={setTiming}
            setPlaybackInfo={setPlaybackInfo}
            setControlAPI={setControlAPI}
          />
          */}
          <PlayerControlContext.Provider value={controlAPI}>
            <PlayerStateContext.Provider value={playbackInfo}>
              <Suspense fallback={<div>loading...</div>}>
                { mobile ? (
                  <MobileSkin
                    theme={theme}
                    player={player}
                    setPlayer={setPlayer}
                    setControlAPI={setControlAPI}
                    setPlaybackInfo={setPlaybackInfo}
                  />
                ) : (
                  <DesktopSkin
                    theme={theme}
                    player={player}
                    setPlayer={setPlayer}
                    setControlAPI={setControlAPI}
                    setPlaybackInfo={setPlaybackInfo}
                  />
                ) }
              </Suspense>
            </PlayerStateContext.Provider>
          </PlayerControlContext.Provider>
        </CheckLogin>
      </ThemeContext.Provider>
    </div>
  );
};
