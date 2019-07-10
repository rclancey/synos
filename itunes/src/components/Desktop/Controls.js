import React, { Fragment, useRef, useState } from 'react';
import { displayTime } from '../../lib/columns';
import { PlayPauseSkip, Progress } from '../Controls';
import { CoverArt } from '../CoverArt';
import { TrackInfo } from '../TrackInfo';
import { Queue } from './Queue';

const Buttons = ({ status, sonos, onPlay, onPause, onSkipBy, onSeekBy, onEnableSonos, onDisableSonos }) => (
  <div className="playpause" style={{ display: 'flex', flexDirection: 'row' }}>
    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1em', flex: 10 }}>
      <div style={{ flex: 2 }} />
      <PlayPauseSkip
        size={24}
        paused={status !== 'PLAYING'}
        onPlay={onPlay}
        onPause={onPause}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
        style={{ flex: 1 }}
        className="buttons"
      />
      <div style={{ flex: 2 }} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '1em' }}>
      <div style={{ flex: 2 }} />
      <AirplayButton sonos={sonos} onEnableSonos={onEnableSonos} onDisableSonos={onDisableSonos} />
      <div style={{ flex: 2 }} />
    </div>
  </div>
);

const AirplayMenu = ({ buttonRef, sonos, onEnableSonos, onDisableSonos }) => {
  const rect = buttonRef.current.getBoundingClientRect();
  return (
    <div className="airplayMenu" style={{
      position: 'absolute',
      left: `${rect.x}px`,
      top: `{$rect.y}px`,
      zIndex: 10,
      width: '322px',
      backgroundColor: 'white',
      border: 'solid #ccc 1px',
      borderRadius: '5px',
      padding: '5px',
      boxSizing: 'border-box',
    }}>
      <div className="item">
        <div className="icon computer" />
        <div className="title">Computer</div>
        <div className="checkbox">
          <input
            type="checkbox"
            checked={!sonos}
            onChange={onDisableSonos}
          />
        </div>
      </div>
      <div className="item">
        <div className="icon sonos" />
        <div className="title">Sonos</div>
        <div className="checkbox">
          <input
            type="checkbox"
            checked={sonos}
            onChange={onEnableSonos}
          />
        </div>
      </div>
    </div>
  );
};

const AirplayButton = ({ sonos, onEnableSonos, onDisableSonos }) => {
  const menuRef = useRef();
  const [open, setOpen] = useState(false);
  return (
    <div
      ref={menuRef}
      style={{
        flex: 1,
        width: '40px',
        height: '26px',
        minHeight: '26px',
        maxHeight: '26px',
        border: 'solid #ccc 1px',
        borderRadius: '5px',
        backgroundColor: '#eee',
      }}
      onClick={() => setOpen(true)}
    >
      <div className="icon airplay" style={{
        width: '18px',
        height: '18px',
        backgroundSize: 'cover',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '4px',
      }} />
      { open ? (
        <Fragment>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9,
            }}
            onClick={evt => { evt.preventDefault(); evt.stopPropagation(); console.debug('cover clicked'); setOpen(false); }}
          />
          <AirplayMenu
            buttonRef={menuRef}
            sonos={sonos}
            onEnableSonos={() => { setOpen(false); onEnableSonos(); }}
            onDisableSonos={() => { setOpen(false); onDisableSonos(); }}
          />
        </Fragment>
      ) : null }
    </div>
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

const NowPlaying = ({ track, currentTime, duration, onSeekTo }) => {
  if (!track) {
    return (<NotPlaying />);
  }
  return (
    <div className="nowplaying">
      <CoverArt track={track} size={56} radius={0} />
      <div style={{
        flex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 100,
          display: 'flex',
          flexDirection: 'row',
        }}>
          <div className="timer">
            <div style={{ flex: 100 }} />
            <div className="currentTime">
              {displayTime(currentTime)}
            </div>
          </div>
          <TrackInfo track={track} />
          <div className="timer">
            <div style={{ flex: 100 }} />
            <div className="currentTime">
              {displayTime(currentTime - duration)}
            </div>
          </div>
        </div>
        <Progress currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} height={4} />
      </div>
    </div>
  );
};

const QueueMenu = ({ queue, queueIndex, onSkipTo }) => {
  const queueRef = useRef();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 2 }} />
      <div ref={queueRef} className="queueMenu" onClick={() => setOpen(true)}>
        <div>1<span className="row" /></div>
        <div>2<span className="row" /></div>
        <div>3<span className="row" /></div>
      </div>
      <div style={{ flex: 2 }} />
      { open ? (
        <Fragment>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9,
            }}
            onClick={() => setOpen(false)}
          />
          <Queue
            buttonRef={queueRef}
            queue={queue}
            queueIndex={queueIndex}
            onSkipTo={onSkipTo}
          />
        </Fragment>
      ) : null }
    </div>
  );
};

const Search = ({ search, onSearch }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
    flex: 10,
    paddingLeft: '3em',
  }}>
    <div style={{ flex: 2 }} />
    <input
      type="text"
      placeholder={'\u{1f50d} Search'}
      value={search || ''}
      onChange={evt => onSearch(evt.target.value)}
    />
    <div style={{ flex: 1 }} />
  </div>
);

const Tools = ({ queue, queueIndex, search, onSkipTo, onSearch }) => (
  <div className="search">
    <QueueMenu queue={queue} queueIndex={queueIndex} onSkipTo={onSkipTo} />
    <Search search={search} onSearch={onSearch} />
  </div>
);
  
export const Controls = ({
  status,
  currentTime,
  duration,
  queue,
  queueIndex,
  search,
  sonos,
  onPlay,
  onPause,
  onSkipTo,
  onSkipBy,
  onSeekTo,
  onSeekBy,
  onSearch,
  onEnableSonos,
  onDisableSonos,
}) => (
  <div className="controls">
    <Buttons status={status} sonos={sonos} onPlay={onPlay} onPause={onPause} onSkipBy={onSkipBy} onSeekBy={onSeekBy} onEnableSonos={onEnableSonos} onDisableSonos={onDisableSonos} />
    <NowPlaying track={queue[queueIndex]} currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} />
    <Tools queue={queue} queueIndex={queueIndex} search={search} onSkipTo={onSkipTo} onSearch={onSearch} />
  </div>
);
