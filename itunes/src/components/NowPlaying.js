import React from 'react';
import { TrackInfo, TrackTime } from './TrackInfo';
import { MobileQueue } from './Queue';
import { CoverArt } from './CoverArt';
import { PlayPauseSkip, Volume } from './Controls';

export const Progress = ({ currentTime, duration, onSeek }) => {
  const seekTo = evt => {
    let l = 0;
    let node = evt.target;
    while (node !== null && node !== undefined) {
      l += node.offsetLeft;
      node = node.offsetParent;
    }
    const xevt = Object.assign({}, evt);
    const x = evt.pageX - l;
    const w = evt.target.offsetWidth;
    const t = duration * x / w;
    onSeek(t);
  };
  const pct = duration > 0 ? 100 * currentTime / duration : 0;
  return (
    <div className="progressContainer" onClick={seekTo}>
      <div className="progress" style={{width: `${pct}%`}} />
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

export const ProgressTimer = ({ currentTime, duration, onSeek, className, style }) => (
  <div className={className} style={style}>
    <Progress currentTime={currentTime} duration={duration} onSeek={onSeek} />
    <Timers currentTime={currentTime} duration={duration} />
  </div>
);

export const Controls = ({ paused, onSkip, onPlay, onPause }) => (
  <div className="controls">
    <div className="fas fa-backward" onClick={() => onSkip(-1)} />
    { paused ? (
      <div className="fas fa-play" onClick={onPlay} />
    ) : (
      <div className="fas fa-pause" onClick={onPause} />
    ) }
    <div className="fas fa-forward" onClick={() => onSkip(1)} />
  </div>
);

export class MobileNowPlaying extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      showQueue: false,
    };
  }

  getTrack() {
    if (this.props.queue === null || this.props.queue === undefined) {
      return null;
    }
    if (this.props.queueIndex === null || this.props.queueIndex === undefined) {
      return null;
    }
    if (this.props.queueIndex < 0 || this.props.queueIndex >= this.props.queue.length) {
      return null;
    }
    return this.props.queue[this.props.queueIndex];
  }

  renderExpanded(track) {
    if (this.state.showQueue) {
      return (
        <MobileQueue
          tracks={this.props.queue}
          index={this.props.queueIndex}
          onSelect={this.props.onSelect}
          onClose={() => this.setState({ showQueue: false })}
        />
      );
    }
    return (
      <div className="nowplaying big">
        <div className="header">
          <div className="collapse fas fa-angle-down" onClick={() => this.setState({ expanded: false })} />
          <div className="title"/>
          <div className="showQueue fas fa-bars" onClick={() => this.setState({ showQueue: true })} />
        </div>
        <div className="content">
          <CoverArt track={track} size={280} radius={10} />
          <Progress
            currentTime={this.props.currentTime}
            duration={this.props.duration}
            onSeek={this.props.onSeek}
          />
          <Timers currentTime={this.props.currentTime} duration={this.props.duration} />
          <TrackInfo track={track} />
          <PlayPauseSkip
            className="controls"
            paused={this.props.paused}
            onPlay={this.props.onPlay}
            onPause={this.props.onPause}
            onSkip={this.props.onSkip}
            onSeek={this.props.onSeekBy}
          />
          <Volume className="volume" volume={this.props.volume} onChange={this.props.onVolumeChange} />
        </div>
      </div>
    );
  }

  render() {
    const track = this.getTrack();
    if (!track) {
      return (
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
    }
    if (this.state.expanded) {
      return this.renderExpanded(track);
    }
    const dur = track.total_time;
    const cur = this.props.currentTime;
    const pct = (dur > 0 ? 100 * cur / dur : 0);
    return (
      <div className="nowplaying">
        <div className="fas fa-angle-up" style={{ padding: '1em 1em 1em 0' }} onClick={() => this.setState({ expanded: true })} />
        <CoverArt track={track} size={48} radius={4} />
        <TrackInfo track={track} />
        <PlayPauseSkip
          className="controls"
          paused={this.props.paused}
          onPlay={this.props.onPlay}
          onPause={this.props.onPause}
          onSkip={this.props.onSkip}
          onSeek={this.props.onSeekBy}
        />
      </div>
    );
  }
}


