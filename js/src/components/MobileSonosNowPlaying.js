import React from 'react';
//import { displayTime } from '../lib/columns';
import { MobileNowPlaying } from './NowPlaying';

export class MobileSonosNowPlaying extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: null,
      queue: [],
      queueIndex: -1,
      currentTime: 0,
      currentTimeSet: 0,
      currentTimeSetAt: 0,
      volume: 0,
    };
  }

  /*
  componentDidMount() {
    let uri = '';
    const loc = document.location;
    if (loc.protocol == 'https:') {
      uri = 'wss://';
    } else {
      uri = 'ws://';
    }
    uri += loc.host;
    uri += '/api/sonos/ws';
    const ws = new WebSocket(uri);
    ws.onopen = evt => {
      console.debug('ws open: %o', evt);
    };
    ws.onmessage = evt => {
      let msg;
      try {
        msg = JSON.parse(evt.data);
      } catch(err) {
        msg = evt;
      }
      const update = {};
      if (msg.queue) {
        if (msg.queue.tracks) {
          update.queue = msg.queue.tracks;
        }
        if (Object.hasOwnProperty.call(msg.queue, 'index')) {
          update.queueIndex = msg.queue.index;
          update.currentTime = msg.queue.time;
          update.currentTimeSet = msg.queue.time;
          update.currentTimeSetAt = Date.now();
        }
        update.status = msg.state;
      } else if (Object.hasOwnProperty.call(msg, 'queue_position')) {
        if (msg.queue_position !== this.state.queueIndex) {
          update.queueIndex = msg.queue_position
          update.currentTime = 0;
          update.currentTimeSet = 0;
          update.currentTimeSetAt = Date.now();
        }
        update.status = msg.state;
      } else if (Object.hasOwnProperty.call(msg, 'tracks')) {
        update.queue = msg.queue.tracks;
        if (Object.hasOwnProperty.call(msg.queue, 'index')) {
          update.queueIndex = msg.queue.index;
          update.currentTime = msg.queue.time;
          update.currentTimeSet = msg.queue.time;
          update.currentTimeSetAt = Date.now();
        }
      } else if (Object.hasOwnProperty.call(msg, 'volume')) {
        update.volume = msg.volume;
      }
      console.debug('ws message: %o => %o', msg, update);
      if (Object.keys(update).length > 0) {
        this.setState(update);
      }
    };
    ws.onerror = evt => {
      console.debug('ws error: %o', evt);
    };
    ws.onclose = evt => {
      console.debug('ws close: %o', evt);
    };
    this.ws = ws;
    fetch('/api/sonos/queue', { method: 'GET' })
      .then(resp => resp.json())
      .then(queue => {
        console.debug(queue)
        this.setState({
          status: queue.state,
          queue: queue.tracks,
          queueIndex: queue.index,
          currentTime: queue.time,
          currentTimeSet: queue.time,
          currentTimeSetAt: Date.now(),
        });
      });
    this.playHeadInterval = setInterval(() => {
      if (this.state.status == 'PLAYING') {
        const t = this.state.currentTimeSet + (Date.now() - this.state.currentTimeSetAt);
        this.setState({ currentTime: t });
      }
    }, 500);
  }
  */

  render() {
    return (
      <MobileNowPlaying
        queue={this.props.queue}
        queueIndex={this.props.queueIndex}
        currentTime={this.props.currentTime}
        paused={this.props.status !== 'PLAYING'}
        onPlay={this.props.onPlay}
        onPause={this.props.onPause}
        onSkip={this.props.onSkip}
        onSeek={this.props.onSeek}
        onSeekBy={this.props.onSeekBy}
        onSelect={this.onQueueSelect}
      />
    );
    /*
    const track = this.state.queue.length > 0 && this.state.queueIndex >= 0 && this.state.queueIndex < this.state.queue.length ? this.state.queue[this.state.queueIndex] : null;
    if (!track) {
      return null;
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
    const cur = this.state.currentTime;
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
    );
    */
  }
}
