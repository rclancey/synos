import React, { useMemo, useRef } from 'react';
import { TrackTime } from './TrackInfo';
import { useTheme } from '../lib/theme';
import { SHUFFLE, REPEAT } from '../lib/api';

const orientations = {
  right: ['Top', 'Bottom', 'Left'],
  left: ['Top', 'Bottom', 'Right'],
  top: ['Left', 'Right', 'Bottom'],
  bottom: ['Left', 'Right', 'Top'],
};

const root3 = Math.sqrt(3);

export const Triangle = ({ orientation, size = 24, ...props }) => {
  const colors = useTheme();
  const style = {
    width: 0,
    height: 0,
    touchAction: 'none',
  };
  const ori = orientations[orientation] || orientations.right;
  ori.slice(0, 2).forEach(d => {
    style[`border${d}`] = `solid transparent ${size / root3}px`;
  });
  const d = ori[2];
  style[`border${d}`] = `solid ${colors.button} ${size}px`;
  return (<div style={style} {...props} />);
};

export const ShuffleButton = ({ playMode, onShuffle, style }) => {
  const colors = useTheme();
  return (
    <div
      className={`shuffle fas fa-random ${playMode & SHUFFLE ? 'on' : ''}`}
      style={style}
      onClick={onShuffle}
    >
      <style jsx>{`
        .shuffle {
          color: ${colors.text};
        }
        .shuffle.on {
          color: ${colors.highlightText};
        }
      `}</style>
    </div>
  );
};

export const RepeatButton = ({ playMode, onRepeat, style }) => {
  const colors = useTheme();
  return (
    <div
      className={`repeat fas fa-recycle ${playMode & REPEAT ? 'on' : ''}`}
      style={style}
      onClick={onRepeat}
    >
      <style jsx>{`
        .repeat {
          color: ${colors.text};
        }
        .repeat.on {
          color: ${colors.highlightText};
        }
      `}</style>
    </div>
  );
};

export const CloseButton = ({ onClose, style }) => {
  const colors = useTheme();
  return (
    <div className="close fas fa-times" onClick={onClose} style={style}>
      <style jsx>{`
        .close {
          color: ${colors.highlightText};
        }
      `}</style>
    </div>
  );
};

export const PlayButton = ({ size, onPlay }) => (
  <Triangle orientation="right" size={size || 24} className="play" onClick={onPlay} />
);

export const PauseButton = ({ size, onPause }) => {
  const colors = useTheme();
  const style = {
    width: `${size / 4}px`,
    height: `${size * 2 / root3}px`,
    borderLeft: `solid ${colors.button} ${size * 7 / 24}px`,
    borderRight: `solid ${colors.button} ${size * 7 / 24}px`,
    marginLeft: `${size / 12}px`,
    marginRight: `${size / 12}px`,
  };
  return (
    <div style={style} className="pause" onClick={onPause} />
  );
};

export const PlayPauseButton = ({ size, paused, onPlay, onPause }) => {
  if (paused) {
    return (<PlayButton size={size} onPlay={onPlay} />);
  }
  return (<PauseButton size={size} onPause={onPause} />);
};

export const Seeker = ({
  size = 15,
  fwd = true,
  onSeek,
  onSkip,
}) => {
  const seeking = useRef(false);
  const interval = useRef(null);
  const div = useRef(null);
  const beginSeek = useMemo(() => {
    return (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (seeking.current) {
        return false;
      }
      if (interval.current !== null) {
        clearInterval(interval.current);
        interval.current = null;
      }
      if (evt.type === 'mousedown') {
        document.addEventListener('mouseup', () => seeking.current = false, { once: true });
      } else if (evt.type === 'touchstart') {
        document.addEventListener('touchend', () => seeking.current = false, { once: true });
      }
      seeking.current = true;
      const startTime = Date.now();
      interval.current = setInterval(() => {
        const t = Date.now() - startTime;
        if (seeking.current) {
          if (t >= 250) {
            onSeek(fwd ? 200 : -200);
          }
        } else {
          clearInterval(interval.current);
          if (t < 250) {
            onSkip(fwd ? 1 : -1);
          }
        }
      }, 40);
    };
  }, [seeking, interval, onSeek, onSkip, fwd]);
  return (
    <div 
      className="seeker"
      ref={div}
      onMouseDown={beginSeek}
      onTouchStart={beginSeek}
    > 
      <div className="padding" />
      <div className="triangles">
        <Triangle orientation={fwd ? "right" : "left"} size={size} />
        <Triangle orientation={fwd ? "right" : "left"} size={size} />
      </div>
      <div className="padding" />
      <style jsx>{`
        .seeker {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .padding {
          flex: 2;
          max-height: ${0.5 * size / root3}px;
        }
        .triangles {
          flex: 1;
          display: flex;
          flex-direction: row;
        }
      `}</style>
    </div>
  );
};

export const RewindButton = ({ size = 15, onSkipBy, onSeekBy }) => (
  <Seeker size={size} fwd={false} onSkip={onSkipBy} onSeek={onSeekBy} />
);

export const FastForwardButton = ({ size = 15, onSkipBy, onSeekBy }) => (
  <Seeker size={size} fwd={true} onSkip={onSkipBy} onSeek={onSeekBy} />
);

export const PlayPauseSkip = ({ width, height, paused, onPlay, onPause, onSkipBy, onSeekBy, ...props }) => {
  return (
    <div className="playPauseSkip" {...props}>
      <RewindButton
        size={height * 0.625}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
      />
      <div className="padding" />
      <PlayPauseButton
        size={height}
        paused={paused}
        onPlay={onPlay}
        onPause={onPause}
      />
      <div className="padding" />
      <FastForwardButton
        size={height * 0.625}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
      />
      <style jsx>{`
        .playPauseSkip {
          display: flex;
          height: ${2 * height / root3}px;
          width: ${width ? `${width}px` : '100%'};
          min-width: ${width ? `${width}px` : '100%'};
          display: flex;
          flex-direction: row;
        }
        .playPauseSkip .padding {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export const Volume = ({ volume, onChange, ...props }) => {
  const colors = useTheme();
  const up = useMemo(() => {
    if (volume >= 50) {
      return Math.min(100, volume + 5);
    }
    if (volume >= 25) {
      return Math.min(100, volume + 2);
    }
    return Math.min(100, volume + 1);
  }, [volume]);
  const down = useMemo(() => {
    return Math.max(0, volume - 5);
  }, [volume]);
  return (
    <div className="volumeControl" {...props}>
      <div
        className="fas fa-volume-down"
        onClick={() => onChange(down)}
      />
      <div className="slider">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume || 0}
          style={{ width: '100%' }}
          onInput={evt => onChange(parseInt(evt.target.value))}
        />
      </div>
      <div
        className="fas fa-volume-up"
        onClick={() => onChange(up)}
      />
      <style jsx>{`
        .volumeControl {
          display: flex;
          color: ${colors.button};
        }
        .volumeControl div.fas {
          flex: 1;
        }
        .volumeControl .fa-volume-down {
          text-align: right;
        }
        .volumeControl .slider {
          flex: 10;
          padding-left: 1em;
          padding-right: 1em;
        }
      `}</style>
    </div>
  );
};

export const Progress = ({ currentTime, duration, onSeekTo, height = 4, ...props }) => {
  const seekTo = evt => {
    let l = 0;
    let node = evt.target;
    while (node !== null && node !== undefined) {
      l += node.offsetLeft;
      node = node.offsetParent;
    }
    //const xevt = Object.assign({}, evt);
    const x = evt.pageX - l;
    const w = evt.target.offsetWidth;
    const t = duration * x / w;
    console.debug('onSeekTo: %o', { l, x, w, t });
    onSeekTo(t);
  };
  const pct = duration > 0 ? 100 * currentTime / duration : 0;
  return (
    <div className="progressContainer" onClick={seekTo} {...props}>
      <div className="progress" style={{ width: `${pct}%` }} />
      <style jsx>{`
        .progressContainer {
          min-height: ${height}px;
          max-height: ${height}px;
          height: ${height}px;
          background-color: #ccc;
        }
        .progress {
          height: ${height}px;
          background-color: #666;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export const Timers = ({ currentTime, duration, ...props }) => (
  <div className="timer" {...props}>
    <TrackTime ms={currentTime} className="currentTime" />
    <div className="padding">{'\u00a0'}</div>
    <TrackTime ms={currentTime - duration} className="remainingTime" />
    <style jsx>{`
      .timer {
        display: flex;
        flex-direction: row;
        width: 100%;
      }
      .padding {
        flex: 10;
      }
    `}</style>
  </div>
);

/*
export const ProgressTimer = ({ currentTime, duration, onSeekTo, className, style }) => (
  <div className={className} style={style}>
    <Progress currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} />
    <Timers currentTime={currentTime} duration={duration} />
  </div>
);
*/

