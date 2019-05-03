import React, { Fragment, useRef, useState } from 'react';
import { displayTime } from '../../lib/columns';
import { PlayPauseSkip, Progress } from '../Controls';
import { CoverArt } from '../CoverArt';
import { TrackInfo } from '../TrackInfo';
import { Queue } from './Queue';

const Buttons = ({ status, onPlay, onPause, onSkipBy, onSeekBy }) => (
  <div className="playpause" style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1em' }}>
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
);
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
      value={search}
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
  onPlay,
  onPause,
  onSkipTo,
  onSkipBy,
  onSeekTo,
  onSeekBy,
  onSearch,
}) => (
  <div className="controls">
    <Buttons status={status} onPlay={onPlay} onPause={onPause} onSkipBy={onSkipBy} onSeekBy={onSeekBy} />
    <NowPlaying track={queue[queueIndex]} currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} />
    <Tools queue={queue} queueIndex={queueIndex} search={search} onSkipTo={onSkipTo} onSearch={onSearch} />
  </div>
);
