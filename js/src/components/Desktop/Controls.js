import React, { useContext, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";

import LoginContext from '../../context/LoginContext';
import displayTime from '../../lib/displayTime';
import { Player } from '../Player/Player';
import { currentTrack, usePlaybackInfo, useControlAPI } from '../Player/Context';
import { PlayPauseSkip, Volume, Progress, ShuffleButton, RepeatButton } from '../Controls';
import { CoverArt } from '../CoverArt';
import { TrackInfo } from '../TrackInfo';
import { Queue } from './Queue';
import { Icon } from '../Icon';
import { SVGIcon } from '../SVGIcon';
import { Cover } from '../Cover';
import { UserAdmin } from './Admin/UserAdmin';
import { ThemeContext } from '../../lib/theme';

import HeadphonesIcon from '../icons/Headphones';
import HamburgerMenuIcon from '../icons/HamburgerMenu';
import GearIcon from '../icons/Gear';

const Buttons = React.memo(({
  status,
  sonos,
  volume,
  onPlay,
  onPause,
  onSkipBy,
  onSeekBy,
  onSetVolumeTo,
  onEnableSonos,
  onDisableSonos,
  onReload,
}) => {
  return (
    <div className="playpause">
      <div className="wrapper">
        <div className="padding" />
        <PlayPauseSkip
          width={120}
          height={24}
          paused={status !== 'PLAYING'}
          onPlay={onPlay}
          onPause={onPause}
          onSkipBy={onSkipBy}
          onSeekBy={onSeekBy}
        />
        <div className="padding" />
      </div>
      <div className="fas fa-redo-alt" onClick={onReload} />
      <div className="foo" style={{ flex: 8 }}>
        <div className="padding" />
        <Volume
          volume={volume}
          onChange={onSetVolumeTo}
        />
        <div className="padding" />
      </div>
      <div className="foo">
        <div className="padding" />
        <AirplayButton
          sonos={sonos}
          onEnableSonos={onEnableSonos}
          onDisableSonos={onDisableSonos}
        />
        <div className="padding" />
      </div>
      <style jsx>{`
        .playpause {
          width: 33%;
          display: flex;
          flex-direction: row;
        }
        .playpause :global(.rewind),
        .playpause :global(.ffwd) {
          padding: 5px;
          margin-left: 1em;
          margin-right: 1em;
        }
        .wrapper {
          display: flex;
          flex-direction: column;
          padding-left: 3em;
          flex: 10;
        }
        .padding {
          flex: 2;
        }
        .foo {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin-right: 1em;
        }
        .fa-redo-alt {
          padding-right: 1em;
          line-height: 52px;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
});

const OutputDevice = React.memo(({ name, icon, enabled, onEnable }) => (
  <div className="device">
    <Icon name={icon} size={18} />
    <div className="title">{name}</div>
    <div className="checkbox">
      <input
        type="checkbox"
        checked={enabled}
        onClick={evt => onEnable(evt.target.checked)}
      />
    </div>
    <style jsx>{`
      .device {
        display: flex;
        flex-direction: row;
      }
      .device :global(.icon) {
        flex: 1;
        margin-right: 1em;
        mackground-size: cover;
      }
      .title {
        flex: 10;
        font-size: 13px;
      }
    `}</style>
  </div>
));

const ButtonMenu = ({
  icon,
  maxWidth = 322,
  open = false,
  setOpen,
  children,
}) => {
  const menuRef = useRef();
  const onOpen = useCallback(() => setOpen(true), []);
  const rect = menuRef.current ? menuRef.current.getBoundingClientRect() : { x: 0, y: 0 };
  return (
    <div ref={menuRef} className="buttonMenu">
      <div className="button" onClick={onOpen}>
        <SVGIcon icn={icon} size={18} />
      </div>
      { open ? (
        <>
          <Cover zIndex={9} onClear={() => setOpen(false)} />
          <div className="menu">
            {children}
          </div>
        </>
      ) : null }
      <style jsx>{`
        .buttonMenu {
          flex: 1;
        }
        .button {
          width: 40px;
          height: 26px;
          min-height: 26px;
          max-height: 26px;
          border-style: solid;
          border-width: 1px;
          border-radius: 5px;
          border-color: var(--border);
        }
        .button :global(.svgIcon), .button :global(.icon) {
          margin-left: auto;
          margin-right: auto;
          margin-top: 4px;
        }
        .menu {
          position: absolute;
          z-index: 10;
          left: ${rect.x}px;
          top: ${rect.y}px;
          width: ${maxWidth}px;
          border-style: solid;
          border-width: 1px;
          border-radius: 5px;
          border-color: var(--border);
          box-sizing: border-box;
          background: var(--gradient);
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

const AirplayButton = ({
  sonos,
  onEnableSonos,
  onDisableSonos
}) => {
  const [open, setOpen] = useState(false);
  const onLocal = useCallback(() => {
    onDisableSonos();
    setOpen(false);
  }, [onDisableSonos]);
  const onSonos = useCallback(() => {
    onEnableSonos();
    setOpen(false);
  }, [onEnableSonos]);
  return (
    <ButtonMenu icon={HeadphonesIcon} open={open} setOpen={setOpen}>
      <div style={{ padding: '5px' }}>
        <OutputDevice
          name="Computer"
          icon="computer"
          enabled={!sonos}
          onEnable={onLocal}
        />
        <OutputDevice
          name="Sonos"
          icon="sonos"
          enabled={sonos}
          onEnable={onSonos}
        />
      </div>
    </ButtonMenu>
  );
};


const NotPlaying = React.memo(() => (
  <span
    className="fab fa-apple"
    style={{
      fontSize: '36pt',
      textAlign: 'center',
      width: '100%',
      padding: '4px',
    }}
  />
));

const Timer = React.memo(({ t, children }) => (
  <div className="timer">
    {children}
    <div className="padding" />
    <div className="currentTime">{displayTime(t)}</div>
    <style jsx>{`
      .timer {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-width: 50px;
        max-width: 50px;
      }
      .padding {
        flex: 100;
      }
      .currentTime {
        flex: 1;
        min-height: 14px;
        max-height: 14px;
        font-size: 11px;
        text-align: right;
        padding-right: 5px;
        padding-bottom: 5px;
        font-variant: tabular-nums;
      }
    `}</style>
  </div>
));

const NowPlaying = React.memo(({
  timing,
  playMode,
  track,
  onSeekTo,
  onShuffle,
  onRepeat,
}) => {
  if (!track) {
    return (<NotPlaying />);
  }
  const style = { textAlign: 'center', marginTop: '3px' };
  return (
    <div className="nowplaying">
      <CoverArt track={track} size={56} radius={0} />
      <div className="outerwrapper">
        <div className="innerwrapper">
          <Timer t={timing.currentTime}><ShuffleButton playMode={playMode} onShuffle={onShuffle} style={style} /></Timer>
          <TrackInfo track={track} className="desktop controls" />
          <Timer t={timing.currentTime - timing.duration}><RepeatButton playMode={playMode} onRepeat={onRepeat} style={style} /></Timer>
        </div>
        <Progress
          currentTime={timing.currentTime}
          duration={timing.duration}
          onSeekTo={onSeekTo}
          height={4}
        />
      </div>
      <style jsx>{`
        .nowplaying {
          width: 34%;
          border-color: var(--border);
          border-left-style: solid;
          border-left-width: 1px;
          border-right-style: solid;
          border-right-width: 1px;
          display: flex;
          height: 56px;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.05);
        }
        .outerwrapper {
          flex: 100;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .innerwrapper {
          flex: 100;
          display: flex;
          flex-direction: row;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
});

const QueueMenu = ({
  playMode,
  queue,
  queueIndex,
  onSkipTo,
  onShuffle,
  onRepeat,
}) => {
  const [open, setOpen] = useState(false);
  const onSelect = useCallback((track, index) => {
    onSkipTo(index);
    setOpen(false);
  }, [onSkipTo]);
  return (
    <ButtonMenu icon={HamburgerMenuIcon} maxWidth={375} open={open} setOpen={setOpen}>
      <Queue
        playMode={playMode}
        tracks={queue || []}
        index={queueIndex}
        onSkipTo={onSkipTo}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
        onSelect={onSelect}
      />
    </ButtonMenu>
  );
};

const DarkMode = ({ darkMode, onChange }) => (
  <div>
    <style jsx>{`
      margin-top: 1em;
    `}</style>
    {'Dark Mode: '}
    <input type="radio" name="darkmode" value="on" checked={darkMode === true} onClick={onChange} />
    {'On\u00a0\u00a0\u00a0'}
    <input type="radio" name="darkmode" value="off" checked={darkMode === false} onClick={onChange} />
    {'Off\u00a0\u00a0\u00a0'}
    <input type="radio" name="darkmode" value="default" checked={darkMode === null} onClick={onChange} />
    {'Default'}
  </div>
);

const themes = [
  'grey',
  'red',
  'orange',
  'yellow',
  'green',
  'seafoam',
  'teal',
  'slate',
  'blue',
  'indigo',
  'purple',
  'fuchsia',
];

const ThemeChooser = ({ theme, onChange }) => (
  <div className="themeChooser">
    <style jsx>{`
      .themeChooser {
        margin-top: 1em;
      }
      .themeChooser select {
        font-size: 14px;
      }
    `}</style>
    {'Theme: '}
    <select value={theme} onChange={onChange}>
      {themes.map((t) => (<option key={t} value={t}>{`${t.substr(0, 1).toUpperCase()}${t.substr(1)}`}</option>))}
    </select>
  </div>
);

const PrefsContent = ({ onClose, onOpenUserAdmin }) => {
  const { onLogout } = useContext(LoginContext);
  const { theme, darkMode, setTheme, setDarkMode } = useContext(ThemeContext);
  const onChangeTheme = useCallback((evt) => setTheme(evt.target.value), [setTheme]);
  const onChangeDark = useCallback((evt) => {
    switch (evt.target.value) {
      case 'on':
        return setDarkMode(true);
      case 'off':
        return setDarkMode(false);
      default:
        return setDarkMode(null);
    }
  }, [setDarkMode]);
  return (
    <div className="prefs">
      <style jsx>{`
        .prefs {
          background: var(--gradient);
          overflow: auto;
          padding: 1em;
          font-size: 14px;
        }
        .prefs p {
          cursor: pointer;
          margin-top: 1em;
        }
      `}</style>
      <DarkMode darkMode={darkMode} onChange={onChangeDark} />
      <ThemeChooser theme={theme} onChange={onChangeTheme} />
      <p onClick={onOpenUserAdmin}>Account Settings</p>
      <p onClick={onLogout}>Logout</p>
    </div>
  );
};

const PrefsMenu = () => {
  const [open, setOpen] = useState(false);
  const [userAdmin, setUserAdmin] = useState(false);
  const onClose = useCallback((evt) => setOpen(false), []);
  const onOpenUserAdmin = useCallback(() => {
    setUserAdmin(true);
    onClose();
  }, [onClose]);
  const onCloseUserAdmin = useCallback(() => {
    setUserAdmin(false);
    onClose();
  }, [onClose]);
  return (
    <>
      <ButtonMenu icon={GearIcon} maxWidth={350} open={open} setOpen={setOpen}>
        <PrefsContent onClose={onClose} onOpenUserAdmin={onOpenUserAdmin} />
      </ButtonMenu>
      {userAdmin ? <UserAdmin onClose={onCloseUserAdmin} /> : null}
    </>
  );
};

const Search = React.memo(({ search, onSearch }) => {
  const node = useRef(null);
  useEffect(() => {
    const handler = event => {
      if (event.ctrlKey && event.code === 'KeyF') {
        event.stopPropagation();
        event.preventDefault();
        if (node.current) {
          console.debug('trying to focus on search input');
          node.current.focus();
          node.current.select();
        } else {
          console.debug('no node to focus');
        }
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, []);
  return (
    <div className="searchBar">
      <div className="padding" />
      <input
        ref={n => node.current = n || node.current}
        tabIndex={20}
        type="text"
        placeholder={/*'\u{1f50d} Search'*/'Search'}
        value={search || ''}
        onInput={evt => onSearch(evt.target.value)}
      />
      <div className="padding" />
      <style jsx>{`
        .searchBar {
          display: flex;
          flex-direction: column;
          max-width: 50%;
          min-width: 50%;
          flex: 2;
          padding-left: 3em;
        }
        .padding {
          flex: 2;
        }
        .searchBar input {
          flex: 1;
          font-size: 10pt;
          border-radius: 30px !important;
          padding: 5px;
          padding-left: 30px;
          width: 100%;
          box-sizing: border-box;
          background-image: url(/assets/icons/search-2.svg);
          background-size: 14px 14px;
          background-repeat: no-repeat;
          background-position: 12px center;
        }
      `}</style>
    </div>
  );
});

const Tools = React.memo(({
  playMode,
  queue,
  queueIndex,
  search,
  onSkipTo,
  onSearch,
  onShuffle,
  onRepeat,
}) => (
  <div className="search">
    <div className="queuebutton">
      <div className="padding" />
      <QueueMenu
        playMode={playMode}
        queue={queue}
        queueIndex={queueIndex}
        onSkipTo={onSkipTo}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
      />
      <div className="padding" />
    </div>
    <div className="queuebutton">
      <div className="padding" />
      <PrefsMenu />
      <div className="padding" />
    </div>
    <div className="padding" />
    <Search search={search} onSearch={onSearch} />
    <style jsx>{`
      .search {
        width: 33%;
        display: flex;
        padding-right: 10px;
        box-sizing: border-box;
      }
      .queuebutton {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-left: 1em;
      }
      .padding {
        flex: 2;
      }
    `}</style>
  </div>
));
  
export const Controls = ({
  search,
  player,
  setPlayer,
  setControlAPI,
  setPlaybackInfo,
  onReload,
  onSearch,
}) => {
  const playbackInfo = usePlaybackInfo();
  const controlAPI = useControlAPI();
  const track = useMemo(() => currentTrack(playbackInfo), [playbackInfo]);
  const [timing, setTiming] = useState({ currentTime: 0, duration: 0 });

  const sonos = useMemo(() => playbackInfo.player === 'sonos', [playbackInfo]);
  const onEnableSonos = useCallback(() => setPlayer('sonos'), [setPlayer]);
  const onDisableSonos = useCallback(() => setPlayer('local'), [setPlayer]);

  return (
    <div className="controls">
      <Player
        player={player}
        setPlayer={setPlayer}
        setTiming={setTiming}
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
      <Buttons
        status={playbackInfo.playStatus}
        volume={playbackInfo.volume}
        sonos={sonos}
        onPlay={controlAPI.onPlay}
        onPause={controlAPI.onPause}
        onSkipBy={controlAPI.onSkipBy}
        onSeekBy={controlAPI.onSeekBy}
        onSetVolumeTo={controlAPI.onSetVolumeTo}
        onEnableSonos={onEnableSonos}
        onDisableSonos={onDisableSonos}
        onReload={onReload}
      />
      <NowPlaying
        timing={timing}
        track={track}
        playMode={playbackInfo.playMode}
        onSeekTo={controlAPI.onSeekTo}
        onShuffle={controlAPI.onShuffle}
        onRepeat={controlAPI.onRepeat}
      />
      <Tools
        queue={playbackInfo.queue}
        queueIndex={playbackInfo.index}
        playMode={playbackInfo.playMode}
        search={search}
        onSkipTo={controlAPI.onSkipTo}
        onSearch={onSearch}
        onShuffle={controlAPI.onShuffle}
        onRepeat={controlAPI.onRepeat}
      />
      <style jsx>{`
        .controls {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 56px;
          max-height: 56px;
          height: 56px;
          background-color: var(--contrast3);
          border-bottom: solid var(--border) 1px;
        }
      `}</style>
    </div>
  );
};
