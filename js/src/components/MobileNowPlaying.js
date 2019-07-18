import React from 'react';
import { displayTime } from '../lib/columns';
import { QueueItem } from './Queue';
import { TrackInfo, TrackTime } from './TrackInfo';

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

const Timers = ({ currentTime, duration }) => (
  <div className="timer">
    <TrackTime ms={currentTime} className="currentTime" />
    <div className="padding">{'\u00a0'}</div>
    <TrackTime ms={currentTime - duration} className="remainingTime" />
  </div>
);

const TrackInfo = ({ track }) => (
  <div className="trackinfo" style={{ flex: 10 }}>
    <div className="name">{track.name}</div>
    <div className="artist">
      {track.artist}
      {' - '}
      {track.album}
    </div>
  </div>
);

/*
const Controls = ({ paused, onSkip, onPlay, onPause }) => (
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

const VolumeControl = ({ volume, onChange }) => (
  <div className="volumeControl">
    <div className="fas fa-volume-down" />
    <div className="slider">
      <input
        type="slider"
        min={0}
        max={100}
        value={volume}
        onChange={evt => onChange(parseInt(evt.target.value))}
      />
    </div>
    <div className="fas fa-volume-up" />
  </div>
);
*/

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

  renderQueue() {
    return (
      <div className="queue">
        <div className="header">
          <div className="title">Queue</div>
          <div className="info">
            {`${this.props.queue.length} ${songs}`}
            {'\u00a0\u2014\u00a0'}
            {this.totalTime()}
          </div>
          <div className="toggles">
            <div className="shuffle" />
            <div className="loop" />
            <div className="close" onClick={() => this.setState({ showQueue: false })} />
          </div>
        </div>
        <div className="items">
          {this.props.queue.map((track, i) => (
            <QueueItem
              track={track}
              selected={i === this.props.queueIndex}
              onSelect={() => this.props.onQueueSelect(track, i)}
            />
          ))}
        </div>
      </div>
    );
  }

  renderExpanded() {
    if (this.state.showQueue) {
      return this.renderQueue();
    }
    return (
      <div className="biginfo">
        <div className="header">
          <div className="collapse" onClick={() => this.setState({ expanded: false })} />
          <div className="title"/>
          <div className="showQueue" onClick={() => this.setState({ showQueue: true })} />
        </div>
        <CoverArt track={track} size={280} radius={10} />
        <Progress
          currentTime={this.props.currentTime}
          duration={this.props.duration}
          onSeek={this.props.onSeek}
        />
        <Timers currentTime={this.props.currentTime} duration={this.props.duration} />
        <TrackInfo track={this.props.track} />
        <Controls
          onSkip={this.props.onSkip}
          onPlay={this.props.onPlay}
          onPause={this.props.onPause}
        />
        <VolumeControl volume={this.props.volume} onChange={this.props.onVolumeChange} />
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
    const dur = track.total_time;
    const cur = this.props.currentTime;
    const pct = (dur > 0 ? 100 * cur / dur : 0);
    return (
      <div className="nowplaying">
        <div style={{
          display: 'flex',
          flexDirection: 'row',
        }}>
          <div
            className="coverart"
            style={{ backgroundImage: `url(/api/cover/${track.persistent_id})` }}
          />
          <div className="trackinfo" style={{ flex: 10 }}>
            <div className="name">{track.name}</div>
            <div className="artist">
              {track.artist}
              {' - '}
              {track.album}
            </div>
          </div>
        </div>
        <div className="progressContainer" onClick={this.seekTo}>
          <div className="progress" style={{width: `${pct}%`}} />
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
        }}>
          <div style={{flex: 1, fontSize: '9px'}}>{displayTime(cur)}</div>
          <div style={{flex: 10}}>{'\u00a0'}</div>
          <div style={{flex: 1, fontSize: '9px'}}>{'-'+displayTime(dur - cur)}</div>
        </div>
      </div>

      <div className="biginfo">
        <div className="header">
          <div className="collapse" onClick={() => this.setState({ expanded: false })} />
          <div className="title"/>
          <div className="showQueue" onClick={() => this.setState({ showQueue: true })} />
        </div>
        <div className="coverart" style={{ backgroundImage: `url(/api/cover/${track.persistent_id})` }} />
        <Progress
          currentTime={this.props.currentTime}
          duration={this.props.duration}
          onSeek={this.props.onSeek}
        />
        <Timers currentTime={this.props.currentTime} duration={this.props.duration} />
        <TrackInfo track={this.props.track} />
        <Controls
          onSkip={this.props.onSkip}
          onPlay={this.props.onPlay}
          onPause={this.props.onPause}
        />
        <VolumeControl volume={this.props.volume} onChange={this.props.onVolumeChange} />
      </div>
    );
  }
}

