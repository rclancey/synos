import React, { Fragment, useRef, useState, useEffect, useContext } from 'react';
import displayTime from '../../lib/displayTime';
import { PlayPauseSkip, Volume, Progress } from '../Controls';
import { CoverArt } from '../CoverArt';
import { TrackInfo } from '../TrackInfo';
import { Queue } from './Queue';
import { Icon } from '../Icon';
import { Cover } from '../Cover';
import { useTheme } from '../../lib/theme';

const Buttons = ({ status, sonos, volume, onPlay, onPause, onSkipBy, onSeekBy, onSetVolumeTo, onEnableSonos, onDisableSonos }) => (
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
        {/*style={{ flex: 1, paddingLeft: '4em' }}*/}
      <div className="padding" />
    </div>
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
    `}</style>
  </div>
);

const OutputDevice = ({ name, icon, enabled, onEnable }) => {
  return (
    <div className="device">
      <Icon name={icon} size={18} />
      <div className="title">{name}</div>
      <div className="checkbox">
        <input
          type="checkbox"
          checked={enabled}
          onChange={evt => onEnable(evt.target.checked)}
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
  );
};

const ButtonMenu = ({
  icon,
  maxWidth = 322,
  children,
}) => {
  const colors = useTheme();
  const menuRef = useRef();
  const [open, setOpen] = useState(false);
  const rect = menuRef.current ? menuRef.current.getBoundingClientRect() : { x: 0, y: 0 };
  return (
    <div ref={menuRef} className="buttonMenu"  onClick={() => setOpen(cur => !cur)}>
      <Icon name={icon} size={18} style={{
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '4px',
      }} />
      { open ? (
        <>
          <Cover zIndex={9} onClear={() => setOpen(false)} />
          <div
            className="menu"
            style={{ left: `${rect.x}px`, top: `${rect.y}px` }}
          >
            {children}
          </div>
        </>
      ) : null }
      <style jsx>{`
        .buttonMenu {
          flex: 1;
          width: 40px;
          height: 26px;
          min-height: 26px;
          max-height: 26px;
          border-style: solid;
          border-width: 1px;
          border-radius: 5px;
        }
        .menu {
          position: absolute;
          z-index: 10;
          width: ${maxWidth}px;
          border-style: solid;
          border-width: 1px;
          border-radius: 5px;
          padding: 5px;
          box-sizing: border-box;
          background-color: ${colors.background};
        }
      `}</style>
    </div>
  );
};

const AirplayButton = ({ sonos, onEnableSonos, onDisableSonos }) => {
  return (
    <ButtonMenu icon="airplay">
      <OutputDevice
        name="Computer"
        icon="computer"
        enabled={!sonos}
        onEnable={() => { console.debug('disable sonos'); onDisableSonos(); }}
      />
      <OutputDevice
        name="Sonos"
        icon="sonos"
        enabled={sonos}
        onEnable={() => { console.debug('enable sonos'); onEnableSonos(); }}
      />
    </ButtonMenu>
  );
};


const NotPlaying = () => (
  <span
    className="fab fa-apple"
    style={{
      fontSize: '36pt',
      textAlign: 'center',
      width: '100%',
      padding: '4px',
    }}
  />
);

const Timer = ({ t }) => (
  <div className="timer">
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
      }
    `}</style>
  </div>
);

const NowPlaying = ({ track, currentTime, duration, onSeekTo }) => {
  const colors = useTheme();
  if (!track) {
    return (<NotPlaying />);
  }
  return (
    <div className="nowplaying">
      <CoverArt track={track} size={56} radius={0} />
      <div className="outerwrapper">
        <div className="innerwrapper">
          <Timer t={currentTime} />
          <TrackInfo track={track} className="desktop controls" />
          <Timer t={currentTime - duration} />
        </div>
        <Progress currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} height={4} />
      </div>
      <style jsx>{`
        .nowplaying {
          width: 34%;
          border-left-style: solid;
          border-left-width: 1px;
          border-right-style: solid;
          border-right-width: 1px;
          display: flex;
          height: 56px;
          overflow: hidden;
          background-color: ${colors.sectionBackground};
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
};

const QueueMenu = ({ playMode, queue, queueIndex, onSkipTo, onShuffle, onRepeat }) => {
  return (
    <ButtonMenu icon="queue">
      <Queue
        playMode={playMode}
        queue={queue}
        queueIndex={queueIndex}
        onSkipTo={onSkipTo}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
      />
    </ButtonMenu>
  );
};

const Search = ({ search, onSearch }) => {
  const node = useRef(null);
  useEffect(() => {
    const handler = event => {
      console.debug('search select handler');
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
        placeholder={'\u{1f50d} Search'}
        value={search || ''}
        onChange={evt => onSearch(evt.target.value)}
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
        input {
          flex: 1;
          font-size: 10pt;
          border-radius: 30px;
          border-style: solid;
          border-width: 1px;
          padding: 5px;
          padding-left: 10px;
          width: 100%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

const Tools = ({ playMode, queue, queueIndex, search, onSkipTo, onSearch, onShuffle, onRepeat }) => (
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
);
  
export const Controls = ({
  search,
  playbackInfo,
  controlAPI,
  setPlayer,
  onSearch,
}) => {
  const colors = useTheme();
  const {
    queue,
    index,
    playStatus,
    currentTime,
    duration,
    volume,
    playMode,
  } = playbackInfo;
  const {
    onPlay,
    onPause,
    onSkipTo,
    onSkipBy,
    onSeekTo,
    onSeekBy,
    onSetVolumeTo,
    onShuffle,
    onRepeat,
  } = controlAPI;

  const sonos = playbackInfo.player === 'sonos';
  const onEnableSonos = () => setPlayer('sonos');
  const onDisableSonos = () => setPlayer('local');

  return (
    <div className="controls">
      <Buttons
        status={playStatus}
        volume={volume}
        sonos={sonos}
        onPlay={onPlay}
        onPause={onPause}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
        onSetVolumeTo={onSetVolumeTo}
        onEnableSonos={onEnableSonos}
        onDisableSonos={onDisableSonos}
      />
      <NowPlaying
        track={queue ? queue[index] : null}
        currentTime={currentTime}
        duration={duration}
        onSeekTo={onSeekTo}
      />
      <Tools
        queue={queue}
        queueIndex={index}
        playMode={playMode}
        search={search}
        onSkipTo={onSkipTo}
        onSearch={onSearch}
        onShuffle={onShuffle}
        onRepeat={onRepeat}
      />
      <style jsx>{`
        .controls {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 56px;
          max-height: 56px;
          height: 56px;
          background-color: ${colors.panelBackground};
        }
      `}</style>
    </div>
  );
};
