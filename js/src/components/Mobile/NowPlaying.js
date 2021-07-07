import React, { useContext, useState, useMemo, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useTheme, ThemeContext } from '../../lib/theme';
import { usePlaybackInfo, useControlAPI, currentTrack } from '../Player/Context';
import { TrackInfo } from '../TrackInfo';
import { CoverArt } from '../CoverArt';
import { PlayPauseSkip, Volume, Progress, Timers } from '../Controls';
import { Switch } from '../Switch';
import { Center } from '../Center';
import { Queue } from './Queue';
import { Player } from '../Player/Player';

const Expander = ({ onExpand }) => {
  const colors = useTheme();
  return (
    <div className="fas fa-angle-up" onClick={onExpand}>
      <style jsx>{`
        div {
          color: var(--highlight);
          padding: 1em 1em 1em 0;
        }
      `}</style>
    </div>
  );
};

const Collapser = ({ onCollapse }) => {
  const colors = useTheme();
  return (
    <div className="collapse fas fa-angle-down" onClick={onCollapse}>
      <style jsx>{`
        div {
          color: var(--highlight);
          padding: 5px 1em;
        }
      `}</style>
    </div>
  );
};

const Hamburger = ({ onOpen }) => {
  const colors = useTheme();
  return (
    <div className="showQueue fas fa-bars" onClick={onOpen}>
      <style jsx>{`
        div {
          color: var(--highlight);
          text-align: right;
          padding: 5px 1em;
        }
      `}</style>
    </div>
  );
};

export const Controls = ({
  player,
  setPlayer,
  setPlaybackInfo,
  setControlAPI,
  onList,
}) => {
  const [timing, setTiming] = useState({ currentTime: 0, duration: 0 });
  const [expanded, setExpanded] = useState(false);
  const onCollapse = useCallback(() => setExpanded(false), []);
  const onExpand = useCallback(() => setExpanded(true), []);
  return (
    <>
      <Player
        player={player}
        setPlaybackInfo={setPlaybackInfo}
        setTiming={setTiming}
        setControlAPI={setControlAPI}
      />
      { expanded ? (
        <ExpandedControls
          timing={timing}
          player={player}
          setPlayer={setPlayer}
          onCollapse={onCollapse}
          onList={onList}
        />
      ) : (
        <MiniControls
          onExpand={onExpand}
        />
      ) }
    </>
  );
};


export const MiniControls = ({
  onExpand,
}) => {
  const playbackInfo = usePlaybackInfo();
  const controlAPI = useControlAPI();
  const colors = useTheme();
  const track = useMemo(() => currentTrack(playbackInfo), [playbackInfo]);

  return (
    <div className="nowplaying">
      <Expander onExpand={onExpand} />
      <CoverArt track={track} size={48} radius={4} />
      <TrackInfo track={track} className="mobile controls" />
      <Center orientation="vertical">
        <PlayPauseSkip
          width={100}
          height={18}
          paused={playbackInfo.playStatus !== 'PLAYING'}
          onPlay={controlAPI.onPlay}
          onPause={controlAPI.onPause}
          onSkipBy={controlAPI.onSkipBy}
          onSeekBy={controlAPI.onSeekBy}
        />
      </Center>
      <style jsx>{`
        .nowplaying {
          padding: 10px;
          position: fixed;
          z-index: 3;
          bottom: 0px;
          width: 100vw;
          box-sizing: border-box;
          border-top-style: solid;
          border-top-width: 1px;
          display: flex;
          flex-direction: row;
          background: var(--contrast5);
        }
        .fa-angle-up {
          color: var(--highlight);
          padding: 1em 1em 1em 0;
        }
      `}</style>
    </div>
  );
};

export const ExpandedControls = ({
  timing,
  player,
  setPlayer,
  onCollapse,
  onList,
}) => {
  const colors = useTheme();
  const playbackInfo = usePlaybackInfo();
  const controlAPI = useControlAPI();
  const track = useMemo(() => currentTrack(playbackInfo), [playbackInfo]);
  const sonos = useMemo(() => playbackInfo.player === 'sonos', [playbackInfo]);
  const onEnableSonos = useCallback(() => setPlayer('sonos'), [setPlayer]);
  const onDisableSonos = useCallback(() => setPlayer('local'), [setPlayer]);
  const [showQueue, setShowQueue] = useState(false);
  const onSelect = useCallback((track, i) => controlAPI.onSkipTo(i), [controlAPI]);
  const onClose = useCallback(() => setShowQueue(false), [setShowQueue]);
  const onListAndCollapse = useCallback((args) => {
    onCollapse();
    onList(args);
  }, [onCollapse, onList]);

  if (showQueue) {
    return (
      <Queue
        playMode={playbackInfo.playMode}
        tracks={playbackInfo.queue}
        index={playbackInfo.index}
        onShuffle={controlAPI.onShuffle}
        onRepeat={controlAPI.onRepeat}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
  }
  return (
    <div className="nowplaying big">
      <Header onCollapse={onCollapse} onShowQueue={() => setShowQueue(true)} />
      <div className="content">
        <CoverArt track={track} size={280} radius={10} />
        <Progress
          style={{
            flex: 1,
            marginTop: '5px',
            marginBottom: '10px',
          }}
          currentTime={timing.currentTime}
          duration={timing.duration}
          onSeekTo={controlAPI.onSeekTo}
        />
        <Timers
          style={{ fontSize: '9px' }}
          currentTime={timing.currentTime}
          duration={timing.duration}
        />
        <TrackInfo track={track} className="mobile controls" onList={onListAndCollapse} />
        <PlayPauseSkip
          style={{
            padding: '0 5em',
            margin: '1em 0',
            boxSizing: 'border-box',
          }}
          height={24}
          paused={playbackInfo.playStatus !== 'PLAYING'}
          onPlay={controlAPI.onPlay}
          onPause={controlAPI.onPause}
          onSkipBy={controlAPI.onSkipBy}
          onSeekBy={controlAPI.onSeekBy}
        />
        <Volume
          volume={playbackInfo.volume}
          style={{width: '100%'}}
          onChange={controlAPI.onSetVolumeTo}
        />
        <SonosSwitch state={sonos} on={onEnableSonos} off={onDisableSonos} />
        <DarkMode />
        <ThemeChooser />

      </div>
      <style jsx>{`
        .nowplaying {
          position: fixed;
          z-index: 3;
          bottom: 0px;
          width: 100vw;
          box-sizing: border-box;
          border-top-style: solid;
          flex-direction: row;
          display: block;
          flex-direction: column;
          height: 100%;
          padding: 0;
          border-top: none;
          background-color: var(--contrast5);
        }
        .nowplaying.big {
          background: var(--gradient);
        }
        .content {
          flex: 10;
          width: 280px;
          min-width: 280px;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
          padding-top: 1em;
        }
        /*
        .nowplaying>div {
          flex-direction: row;
          width: 100%;
          flex: 1;
          display: block;
        }
        .nowplaying.big :global(.timer) {
          display: flex;
          flex-direction: row;
        }
        .nowplaying.big :global(.currentTime),
        .nowplaying.big :global(.remainingTime) {
          flex: 1;
          font-size: 9px;
        }
        .nowplaying.big :global(.timer .padding) {
          flex: 10;
        }
        .nowplaying.big :global(.playPauseSkip) {
          padding: 0 5em;
          margin: 1em 0;
          box-sizing: border-box;
        }
        .nowplaying.big :global(.progressContainer) {
          flex: 1;
          min-height: 4px;
          max-height: 4px;
          margin-top: 5px;
          margin-bottom: 10px;
        }
        .nowplaying.big :global(.progressContainer .progress) {
          pointer-events: none;
          height: 4px;
        }
        */
      `}</style>
    </div>
  );
};

/*
export const NowPlaying = ({
  controlAPI,
  playbackInfo,
  sonos,
  onEnableSonos,
  onDisableSonos,
}) => {
  const colors = useTheme();
  const [expanded, setExpanded] = useState(false);
  const track = useMemo(() => {
    if (!playbackInfo.queue) {
      return {};
    }
    return playbackInfo.queue[playbackInfo.index] || {};
  }, [playbackInfo.queue, playbackInfo.index]);
  const onCollapse = useCallback(() => setExpanded(false), [setExpanded]);
  const onExpand = useCallback(() => setExpanded(true), [setExpanded]);

  if (expanded) {
    return (
      <Expanded
        playbackInfo={playbackInfo}
        controlAPI={controlAPI}
        track={track}
        sonos={sonos}
        onEnableSonos={onEnableSonos}
        onDisableSonos={onDisableSonos}
        onCollapse={onCollapse}
      />
    );
  }
  return (
    <div className="nowplaying">
      <Expander onExpand={onExpand} />
      <CoverArt track={track} size={48} radius={4} />
      <TrackInfo track={track} className="mobile controls" />
      <Center orientation="vertical">
        <PlayPauseSkip
          width={100}
          height={18}
          paused={playbackInfo.playStatus !== 'PLAYING'}
          onPlay={controlAPI.onPlay}
          onPause={controlAPI.onPause}
          onSkipBy={controlAPI.onSkipBy}
          onSeekBy={controlAPI.onSeekBy}
        />
      </Center>
      <style jsx>{`
        .nowplaying {
          padding: 10px;
          position: fixed;
          z-index: 3;
          bottom: 0px;
          width: 100vw;
          box-sizing: border-box;
          border-top-style: solid;
          border-top-width: 1px;
          display: flex;
          flex-direction: row;
          background: ${colors.background};
        }
        .fa-angle-up {
          color: ${colors.highlightText};
          padding: 1em 1em 1em 0;
        }
      `}</style>
    </div>
  );
};
*/

const Header = ({ onCollapse, onShowQueue }) => (
  <div className="header">
    <Collapser onCollapse={onCollapse} />
    <div className="padding" />
    <Hamburger onOpen={onShowQueue} />
    <style jsx>{`
      .header {
        padding: 0;
        display: flex;
        flex-direction: row;
        width: 100%;
        flex: 1;
      }
      .padding {
        flex: 10;
      }
    `}</style>
  </div>
);

const SonosSwitch = ({ state, on, off }) => (
  <div className="sonosSwitch">
    <Switch
      on={state}
      onToggle={val => {
        if (val) { on() }
        else { off() }
      }}
    />
    <div className="label">Play on Sonos</div>
    <style jsx>{`
      .sonosSwitch {
        display: flex;
        flex-direction: row;
        margin-top: 2em;
      }
      .label {
        flex: 10;
        padding-left: 1em;
        font-size: 18px;
        font-weight: bold;
      }
    `}</style>
  </div>
);

const DarkMode = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  return (
    <div>
      <style jsx>{`
        margin-top: 1em;
      `}</style>
      Dark Mode:
      <input type="radio" name="darkmode" value="on" checked={darkMode === true} onClick={() => setDarkMode(true)} />
      {'On\u00a0\u00a0\u00a0'}
      <input type="radio" name="darkmode" value="off" checked={darkMode === false} onClick={() => setDarkMode(false)} />
      {'Off\u00a0\u00a0\u00a0'}
      <input type="radio" name="darkmode" value="default" checked={darkMode === null} onClick={() => setDarkMode(null)} />
      {'Default'}
    </div>
  );
};

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

const ThemeChooser = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const onChange = useCallback((evt) => setTheme(evt.target.value), [setTheme]);
  return (
    <div>
      <style jsx>{`
        margin-top: 1em;
      `}</style>
      Theme:
      <select value={theme} onChange={onChange}>
        {themes.map((t) => (<option key={t} value={t}>{`${t.substr(0, 1).toUpperCase()}${t.substr(1)}`}</option>))}
      </select>
    </div>
  );
};

/*
const Expanded = ({
  playbackInfo,
  controlAPI,
  track,
  sonos,
  onEnableSonos,
  onDisableSonos,
  onCollapse,
}) => {
  const colors = useTheme();
  const [showQueue, setShowQueue] = useState(false);
  const onSelect = useCallback((track, i) => controlAPI.onSkipTo(i), [controlAPI]);
  const onClose = useCallback(() => setShowQueue(false), [setShowQueue]);
  if (showQueue) {
    return (
      <Queue
        playMode={playbackInfo.playMode}
        tracks={playbackInfo.queue}
        index={playbackInfo.index}
        onShuffle={controlAPI.onShuffle}
        onRepeat={controlAPI.onRepeat}
        onSelect={onSelect}
        onClose={onClose}
      />
    );
  }
  return (
    <div className="nowplaying big">
      <Header onCollapse={onCollapse} onShowQueue={() => setShowQueue(true)} />
      <div className="content">
        <CoverArt track={track} size={280} radius={10} />
        <Progress
          style={{
            flex: 1,
            marginTop: '5px',
            marginBottom: '10px',
          }}
          currentTime={playbackInfo.currentTime}
          duration={playbackInfo.duration}
          onSeekTo={controlAPI.onSeekTo}
        />
        <Timers
          style={{ fontSize: '9px' }}
          currentTime={playbackInfo.currentTime}
          duration={playbackInfo.duration}
        />
        <TrackInfo track={track} className="mobile controls" />
        <PlayPauseSkip
          style={{
            padding: '0 5em',
            margin: '1em 0',
            boxSizing: 'border-box',
          }}
          height={24}
          paused={playbackInfo.playStatus !== 'PLAYING'}
          onPlay={controlAPI.onPlay}
          onPause={controlAPI.onPause}
          onSkipBy={controlAPI.onSkipBy}
          onSeekBy={controlAPI.onSeekBy}
        />
        <Volume
          volume={playbackInfo.volume}
          style={{width: '100%'}}
          onChange={controlAPI.onSetVolumeTo}
        />
        <SonosSwitch state={sonos} on={onEnableSonos} off={onDisableSonos} />

      </div>
      <style jsx>{`
        .nowplaying {
          position: fixed;
          z-index: 3;
          bottom: 0px;
          width: 100vw;
          box-sizing: border-box;
          border-top-style: solid;
          flex-direction: row;
          display: block;
          flex-direction: column;
          height: 100%;
          padding: 0;
          border-top: none;
          background-color: ${colors.background};
        }
        .content {
          flex: 10;
          width: 280px;
          min-width: 280px;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
          padding-top: 1em;
        }
      `}</style>
    </div>
  );
};
*/
