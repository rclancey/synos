import React from 'react';
import { TrackTime } from './TrackInfo';

const orientations = {
  right: ['Top', 'Bottom', 'Left'],
  left: ['Top', 'Bottom', 'Right'],
  top: ['Left', 'Right', 'Bottom'],
  bottom: ['Left', 'Right', 'Top'],
};

const root3 = Math.sqrt(3);
//let sizeV, sizeU;

const parseSize = (size, dflt) => {
  if (size === null || size === undefined) {
    return { v: dflt, u: 'px' };
  }
  if (typeof size === 'number') {
    return { v: size, u: 'px' };
  }
  const m = size.match(/^([0-9.]+)(px|pt|pc|q|mm|cm|in|em|rem|ex|ch|vw|vh)?$/);
  if (m) {
    return { v: parseFloat(m[1]), u: m[2] || 'px' };
  }
  return { v: dflt, u: 'px' };
};

export const Triangle = ({ orientation, size, color, style, ...props }) => {
  const sz = parseSize(size, 24);
  const xstyle = Object.assign({}, style, {
    width: 0,
    height: 0,
  });
  const ori = orientations[orientation] || orientations.right;
  ori.slice(0, 2).forEach(d => {
    xstyle[`border${d}Color`] = 'transparent';
    xstyle[`border${d}Style`] = 'solid';
    xstyle[`border${d}Width`] = `${sz.v / root3}${sz.u}`;
  });
  const d = ori[2];
  //xstyle[`border${d}Color`] = color || 'black';
  xstyle[`border${d}Style`] = 'solid';
  xstyle[`border${d}Width`] = `${sz.v}${sz.u}`;
  return (<div style={xstyle} {...props} />);
};


export const PlayButton = ({ size, onPlay }) => (
  <Triangle orientation="right" size={size || 24} color="#444" className="play" onClick={onPlay} />
);

export const PauseButton = ({ size, onPause }) => {
  const sz = parseSize(size, 24);
  const style = {
    width: `${sz.v / 4}${sz.u}`,
    height: `${sz.v * 2 / root3}${sz.u}`,
    borderLeftStyle: 'solid',
    //borderLeftColor: '#444',
    borderLeftWidth: `${sz.v * 7 / 24}${sz.u}`,
    borderRightStyle: 'solid',
    //borderRightColor: '#444',
    borderRightWidth: `${sz.v * 7 / 24}${sz.u}`,
    marginLeft: `${sz.v / 12}${sz.u}`,
    marginRight: `${sz.v / 12}${sz.u}`,
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

export class Seeker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      seeking: false,
    };
    this.div = React.createRef();
    this.interval = null;
    this.beginSeek = this.beginSeek.bind(this);
  }

  beginSeek(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.state.seeking) {
      return false;
    } 
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (evt.type === 'mousedown') {
      document.addEventListener('mouseup', () => this.setState({ seeking: false }), { once: true });
    } else if (evt.type === 'touchstart') { 
      document.addEventListener('touchend', () => this.setState({ seeking: false }), { once: true });
    } 
    this.setState({ seeking: true }, () => {
      const startTime = Date.now();
      this.interval = setInterval(() => {
        const t = Date.now() - startTime;
        if (this.state.seeking) {
          if (t >= 250) {
            this.props.onSeek();
          } 
        } else {
          clearInterval(this.interval);
          this.interval = null;
          if (t < 250) {
            this.props.onSkip();
          } 
        } 
      }, 40);
    });
  } 
  
  render() {
    return (
      <div 
        ref={this.div}
        className={this.props.className}
        style={this.props.style}
        onMouseDown={this.beginSeek}
        onTouchStart={this.beginSeek}
      > 
        {this.props.children}
      </div>
    );
  } 
}

export const RewindButton = ({ size, onSkipBy, onSeekBy }) => (
  <Seeker style={{ display: 'flex' }} className="rewind" onSkip={() => onSkipBy(-1)} onSeek={() => onSeekBy(-200)}>
    <Triangle orientation="left" size={size || 15} color="#444" />
    <Triangle orientation="left" size={size || 15} color="#444" />
  </Seeker>
);

export const FastForwardButton = ({ size, onSkipBy, onSeekBy }) => (
  <Seeker style={{ display: 'flex' }} className="ffwd" onSkip={() => onSkipBy(1)} onSeek={() => onSeekBy(200)}>
    <Triangle orientation="right" size={size || 15} color="#444" />
    <Triangle orientation="right" size={size || 15} color="#444" />
  </Seeker>
);

export const PlayPauseSkip = ({ size, paused, onPlay, onPause, onSkipBy, onSeekBy, style, ...props }) => {
  const sz = parseSize(size, 24);
  return (
    <div style={{ display: 'flex', ...style }} {...props}>
      <RewindButton size={`${sz.v * 0.625}${sz.u}`} onSkipBy={onSkipBy} onSeekBy={onSeekBy} />
      <PlayPauseButton size={`${sz.v}${sz.u}`} paused={paused} onPlay={onPlay} onPause={onPause} />
      <FastForwardButton size={`${sz.v * 0.625}${sz.u}`} onSkipBy={onSkipBy} onSeekBy={onSeekBy} />
    </div>
  );
};

export const Volume = ({ volume, onChange, style, ...props }) => (
  <div style={{ ...style, display: 'flex' }} {...props}>
    <div className="fas fa-volume-down" style={{ flex: 1 }}  onClick={() => onChange(volume - 10)} />
    <div style={{ flex: 10, paddingLeft: '1em', paddingRight: '1em' }}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={volume}
        style={{ width: '100%' }}
        onChange={evt => onChange(parseInt(evt.target.value))}
      />
    </div>
    <div className="fas fa-volume-up" style={{ flex: 1 }} onClick={() => onChange(volume + 10)}/>
  </div>
);

export const Progress = ({ currentTime, duration, onSeekTo, height, background, color, style, ...props }) => {
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
    onSeekTo(t);
  };
  const pct = duration > 0 ? 100 * currentTime / duration : 0;
  const sz = parseSize(height, 4)
  return (
    <div
      style={{
        ...style,
        minHeight: `${sz.v}${sz.u}`,
        maxHeight: `${sz.v}${sz.u}`,
        height: `${sz.v}${sz.u}`,
        backgroundColor: background || '#ccc',
      }}
      onClick={seekTo}
      {...props}
    >
      <div
        className="progress"
        style={{
          width: `${pct}%`,
          height: `${sz.v}${sz.u}`,
          backgroundColor: color || '#666',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export const Timers = ({ currentTime, duration }) => (
  <div className="timer">
    <TrackTime ms={currentTime} className="currentTime" />
    <div className="padding">{'\u00a0'}</div>
    <TrackTime ms={currentTime - duration} className="remainingTime" />
  </div>
);

export const ProgressTimer = ({ currentTime, duration, onSeekTo, className, style }) => (
  <div className={className} style={style}>
    <Progress currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} />
    <Timers currentTime={currentTime} duration={duration} />
  </div>
);

