import React, { Suspense, useMemo, useRef, useState, useReducer, useEffect } from 'react';
import { useDarkMode, useMobile } from '../lib/useMedia';
import { setTheme, ThemeContext } from '../lib/theme';
import WithLogin from './Login/WithLogin';
import { PlayerControlContext, PlayerStateContext } from './Player/Context';

/*
const DesktopSkin = React.lazy(() => import('./Desktop/Skin'));
const MobileSkin = React.lazy(() => import('./Mobile/Skin'));
*/
import DesktopSkin from './Desktop/Skin';
import MobileSkin from './Mobile/Skin';

const InstallAppButton = ({ onInstall }) => (
  <div className="installApp" onClick={onInstall}>
    install me
  </div>
);

const defaultState = {
  dark: null,
  theme: 'grey',
  output: 'local',
};

const initState = () => {
  if (typeof window === 'undefined') {
    return defaultState;
  }
  const saved = window.localStorage.getItem('prefs');
  if (saved === null || saved === undefined || saved === '') {
    return defaultState;
  }
  const state = JSON.parse(saved);
  return { ...defaultState, ...state };
};

const saveState = state => {
  if (typeof window === 'undefined') {
    return state;
  }
  window.localStorage.setItem('prefs', JSON.stringify(state));
  return state;
};

const reducer = (state, action) => {
  switch (action.type) {
  case 'setOutput':
    return saveState({ ...state, output: (action.value || 'local') });
  case 'setDarkMode':
    return saveState({ ...state, dark: action.value });
  case 'setTheme':
    return saveState({ ...state, theme: action.value });
  case 'clone':
    return { ...state };
  default:
    console.error("unhandled action: %o", action);
  }
  return state;
};

export const Main = () => {
  const [state, dispatch] = useReducer(reducer, null, initState);
  const [playbackInfo, setPlaybackInfo] = useState({});
  const [controlAPI, setControlAPI] = useState({});
  const mobile = useMobile();
  const dark = useDarkMode();
  //console.debug('useDarkMode() = %o', dark);
  const [installPrompt, setInstallPrompt] = useState(null);
  const setThemeLocal = useMemo(() => {
    return (value) => dispatch({ type: 'setTheme', value });
  }, [dispatch]);
  const setDarkMode = useMemo(() => {
    return (value) => dispatch({ type: 'setDarkMode', value });
  }, [dispatch]);
  const setPlayer = useMemo(() => {
    return (value) => dispatch({ type: 'setOutput', value });
  }, [dispatch]);

  useEffect(() => {
    setTimeout(() => {
      console.debug('clone');
      dispatch({ type: 'clone' });
    }, 100);
  }, []);

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

  const themeCtx = useMemo(() => ({
    dark: state.dark === null ? dark : state.dark,
    darkMode: state.dark,
    theme: state.theme,
    setTheme: setThemeLocal,
    setDarkMode,
  }), [dark, state, setThemeLocal, setDarkMode]);

  //console.debug('dark = %o; state.dark = %o, theme.dark = %o', dark, state.dark, themeCtx.dark);
  const transitionId = useRef(null);
  useEffect(() => {
    if (transitionId.current === null) {
      transitionId.current = Math.random();
      setTheme(state.theme, state.dark === null ? dark : state.dark, 0);
      return;
    }
    setTheme(state.theme, state.dark === null ? dark : state.dark, 5000);
  }, [state, dark]);

  const clsName = `App ${themeCtx.dark ? 'dark' : 'light'} ${themeCtx.theme}`;
  return (
    <ThemeContext.Provider value={themeCtx}>
      <div id="main" className={clsName}>
        <WithLogin>
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
              {/*
              <Suspense fallback={<div>loading...</div>}>
              */}
                { mobile ? (
                  <MobileSkin
                    dark={state.dark}
                    theme={state.theme}
                    player={state.output}
                    setPlayer={setPlayer}
                    setControlAPI={setControlAPI}
                    setPlaybackInfo={setPlaybackInfo}
                  />
                ) : (
                  <DesktopSkin
                    dark={state.dark}
                    theme={state.theme}
                    player={state.output}
                    setPlayer={setPlayer}
                    setControlAPI={setControlAPI}
                    setPlaybackInfo={setPlaybackInfo}
                  />
                ) }
              {/*
              </Suspense>
              */}
            </PlayerStateContext.Provider>
          </PlayerControlContext.Provider>
        </WithLogin>
      </div>
    </ThemeContext.Provider>
  );
};
