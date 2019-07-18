import React from 'react';
import { TrackInfo } from '../TrackInfo';
import { Queue } from './Queue';
import { CoverArt } from '../CoverArt';
import { PlayPauseSkip, Volume, Progress, Timers } from '../Controls';
import { Switch } from '../Switch';

export class NowPlaying extends React.Component {
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
        <Queue
          tracks={this.props.queue}
          index={this.props.queueIndex}
          onSelect={(track, i) => this.props.onSkipTo(i)}
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
            onSeekTo={this.props.onSeekTo}
          />
          <Timers currentTime={this.props.currentTime} duration={this.props.duration} />
          <TrackInfo track={track} />
          <PlayPauseSkip
            className="controls"
            size={24}
            paused={this.props.status !== 'PLAYING'}
            onPlay={this.props.onPlay}
            onPause={this.props.onPause}
            onSkipBy={this.props.onSkipBy}
            onSeekBy={this.props.onSeekBy}
          />
          <Volume className="volume" volume={this.props.volume} onChange={this.props.onSetVolumeTo} />

          <div className="sonosSwitch">
            <Switch
              on={this.props.sonos}
              onToggle={val => {
                if (val) { this.props.onEnableSonos() }
                else { this.props.onDisableSonos() }
              }}
            />
            <div className="label">Play on Sonos</div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    let track = this.getTrack();
    if (!track) {
      track = {};
      /*
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
      */
    }
    if (this.state.expanded) {
      return this.renderExpanded(track);
    }
    //const dur = track.total_time;
    //const cur = this.props.currentTime;
    //const pct = (dur > 0 ? 100 * cur / dur : 0);
    return (
      <div className="nowplaying">
        <div className="fas fa-angle-up" style={{ padding: '1em 1em 1em 0' }} onClick={() => this.setState({ expanded: true })} />
        <CoverArt track={track} size={48} radius={4} />
        <TrackInfo track={track} />
        <PlayPauseSkip
          className="controls"
          size={18}
          paused={this.props.status !== 'PLAYING'}
          onPlay={this.props.onPlay}
          onPause={this.props.onPause}
          onSkipBy={this.props.onSkipBy}
          onSeekBy={this.props.onSeekBy}
        />
      </div>
    );
  }
}

