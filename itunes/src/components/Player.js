import React, { Fragment } from 'react';
import {
  playSonos,
  pauseSonos,
  getSonosQueue,
  replaceSonosQueue,
  insertIntoSonosQueue,
  appendToSonosQueue,
  seekSonosBy,
  seekSonosTo,
  skipSonosBy,
  skipSonosTo,
  getSonosVolume,
  setSonosVolumeTo,
  changeSonosVolumeBy,
} from '../lib/sonos';

import { MobileSkin } from './Mobile/Skin';
import { DesktopSkin } from './Desktop/Skin';

export class Player extends React.Component {
  constructor(props) {
    super(props);
    const savedState = this.getSavedState();
    this.state = Object.assign({
      status: 'PAUSED',
      queue: [],
      queueIndex: 0,
      duration: 0,
      currentTime: 0,
      currentTimeSet: 0,
      currentTimeSetAt: 0,
      volume: 50,
      sonos: false,
    }, savedState);

    this.savedState = this.state;
    this.currentPlayer = React.createRef();
    this.nextPlayer = React.createRef();

    this.onPlay = this.onPlay.bind(this);
    this.onPause = this.onPause.bind(this);
    this.onSeekTo = this.onSeekTo.bind(this);
    this.onSeekBy = this.onSeekBy.bind(this);
    this.onSkipTo = this.onSkipTo.bind(this);
    this.onSkipBy = this.onSkipBy.bind(this);
    this.onReplaceQueue = this.onReplaceQueue.bind(this);
    this.onAppendToQueue = this.onAppendToQueue.bind(this);
    this.onInsertIntoQueue = this.onInsertIntoQueue.bind(this);
    this.onChangeVolumeBy = this.onChangeVolumeBy.bind(this);
    this.onSetVolumeTo = this.onSetVolumeTo.bind(this);
    this.onEnableSonos = this.onEnableSonos.bind(this);
    this.onDisableSonos = this.onDisableSonos.bind(this);

    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onTrackEnd = this.onTrackEnd.bind(this);

    this.onSonosMessage = this.onSonosMessage.bind(this);
    this.onSonosError = this.onSonosError.bind(this);
    this.onSonosClose = this.onSonosClose.bind(this);

    this.sonos = null;
    this.sonosTimeKeeper = null;
  }

  saveState() {
    if (typeof window !== 'undefined') {
      let newSave = {};
      let saved = false;
      if (this.state.queue !== this.savedState.queue) {
        window.localStorage.setItem('playerQueue', JSON.stringify(this.state.queue));
        saved = true;
      }
      newSave.queue = this.state.queue;
      const ps = {
        volume: this.state.volume,
        sonos: this.state.sonos,
      };
      if (!this.state.sonos) {
        ps.queueIndex = this.state.queueIndex;
        if (this.savedState.currentTime === undefined || this.savedState.currentTime === null || Math.abs(this.savedState.currentTime - this.state.currentTime) > 5000) {
          ps.currentTime = this.state.currentTime;
        } else {
          ps.currentTime = this.savedState.currentTime;
        }
      }
      const keys = ['queueIndex', 'currentTime', 'volume', 'sonos'];
      if (keys.some(key => ps[key] !== this.savedState[key])) {
        window.localStorage.setItem('playerState', JSON.stringify(ps));
        saved = true;
      }
      newSave = Object.assign({}, newSave, ps);
      if (saved) {
        this.savedState = newSave;
      }
    }
  }

  getSavedState() {
    let state = {};
    if (typeof window !== 'undefined') {
      try {
        const data = window.localStorage.getItem('playerQueue');
        if (data !== undefined && data !== null) {
          state.queue = JSON.parse(data);
        }
      } catch (err) {
        // noop
      }
      try {
        const data = window.localStorage.getItem('playerState');
        if (data !== undefined && data !== null) {
          state = Object.assign({}, state, JSON.parse(data));
        }
      } catch (err) {
        // noop
      }
    }
    return state;
  }

  onEnableSonos() {
    if (this.state.queue.length === 0) {
      this.setState({ sonos: true }, () => this.startupSonos());
    } else {
      this.transferQueueToSonos();
    }
  }

  onDisableSonos() {
    this.setState({ sonos: false }, () => this.shutdownSonos());
  }

  shutdownSonos() {
    if (this.sonos) {
      pauseSonos();
      this.sonos.close();
      this.sonos = null;
    }
  }

  sonosUri() {
    let uri = '';
    const loc = document.location
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.host}/api/sonos/ws`;
  }

  onSonosMessage(evt) {
    evt.data.split(/\n/)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (err) {
          return line
        }
      })
      .forEach(msg => {
        const update = {};
        if (msg.queue) {
          if (msg.queue.tracks) {
            update.queue = msg.queue.tracks;
          }
          if (Object.hasOwnProperty.call(msg.queue, 'index')) {
            update.queueIndex = msg.queue.index;
            if (msg.queue.tracks) {
              update.duration = msg.queue.tracks[msg.queue.index].total_time;
            }
            update.currentTime = msg.queue.time;
            update.currentTimeSet = msg.queue.time;
            update.currentTimeSetAt = Date.now();
          }
          update.status = msg.state;
        } else if (Object.hasOwnProperty.call(msg, 'queue_position')) {
          if (msg.queue_position !== this.state.queueIndex) {
            update.queueIndex = msg.queue_position
            update.duration = msg.current_track.total_time;
            update.currentTime = 0;
            update.currentTimeSet = 0;
            update.currentTimeSetAt = Date.now();
          }
          update.status = msg.state;
        } else if (Object.hasOwnProperty.call(msg, 'tracks')) {
          update.queue = msg.tracks;
          if (Object.hasOwnProperty.call(msg, 'index')) {
            update.queueIndex = msg.index;
            update.duration = msg.tracks[msg.index].total_time;
            update.currentTime = msg.time;
            update.currentTimeSet = msg.time;
            update.currentTimeSetAt = Date.now();
          }
        } else if (Object.hasOwnProperty.call(msg, 'volume')) {
          update.volume = msg.volume;
        }
        if (Object.keys(update).length > 0) {
          this.setState(update);
        }
      });
  }

  onSonosError() {
    const sonos = this.sonos;
    this.sonos = null;
    sonos.close();
    this.startupSonos();
  }

  onSonosClose() {
    if (this.state.sonos) {
      this.sonos = null;
      this.startupSonos();
    }
  }

  startupSonos() {
    if (this.sonos !== null) {
      return Promise.resolve(this.sonos);
    }
    if (this.sonosTimeKeeper !== null) {
      clearInterval(this.sonosTimeKeeper);
      this.sonosTimeKeeper = null;
    }
    const uri = this.sonosUri();
    return new Promise(resolve => {
      this.sonos = new WebSocket(uri);
      this.sonos.onopen = evt => {
        getSonosQueue()
          .then(queue => {
            console.debug('updating with sonos queue info %o', queue);
            this.setState({
              status: queue.state,
              queue: queue.tracks,
              queueIndex: queue.index,
              duration: queue.duration,
              currentTime: queue.time,
              currentTimeSet: queue.time,
              currentTimeSetAt: Date.now(),
              volume: queue.volume,
            }, () => console.debug('set sonos state %o', this.state));
          });
        setInterval(() => {
          let t = Math.min(this.state.duration, Math.max(0, this.state.currentTimeSet + (Date.now() - this.state.currentTimeSetAt)));
          this.setState({ currentTime: t });
        }, 250);
        resolve(this.sonos);
      };
      this.sonos.onmessage = this.onSonosMessage;
      this.sonos.onerror = this.onSonosError;
      this.sonos.onclose = this.onSonosClose;
    });
  }

  transferQueueToSonos() {
    const status = this.state.status;
    this.currentPlayer.current.pause();
    const tracks = this.state.queue;
    const index = this.state.queueIndex;
    const ms = this.currentPlayer.current.currentTime;
    return new Promise(resolve => {
      this.setState({ sonos: true }, () => {
        this.startupSonos()
          .then(() => pauseSonos())
          .then(() => replaceSonosQueue(tracks))
          .then(() => skipSonosTo(index))
          .then(() => seekSonosTo(ms))
          .then(() => {
            if (status === 'PLAYING') {
              return playSonos();
            }
            return true;
          })
          .then(() => getSonosVolume())
          .then(volume => this.setState({ volume }, resolve));
      });
    });
  }

  onPlay() {
    if (this.state.sonos) {
      playSonos();
    } else {
      if (this.currentPlayer.current) {
        this.currentPlayer.current.volume = this.state.volume / 100;
        this.currentPlayer.current.play();
      } else {
        this.setState({ status: 'PLAYING' });
      }
    }
  }

  onPause() {
    if (this.state.sonos) {
      pauseSonos();
    } else {
      if (this.currentPlayer.current) {
        this.currentPlayer.current.pause();
      } else {
        this.setState({ status: 'PAUSED' });
      }
    }
  }

  onReplaceQueue(tracks) {
    if (this.state.sonos) {
      replaceSonosQueue(tracks);
    } else {
      this.setState({ queue: tracks, queueIndex: 0, status: 'PLAYING' });
    }
  }

  onAppendToQueue(tracks) {
    if (this.state.sonos) {
      appendToSonosQueue(tracks);
    } else {
      this.setState({ queue: this.state.queue.concat(tracks) });
    }
  }

  onInsertIntoQueue(tracks) {
    if (this.state.sonos) {
      insertIntoSonosQueue(tracks);
    } else {
      if (this.state.queue.length == 0) {
        this.onReplaceQueue(tracks);
      } else {
        const before = this.state.queue.slice(0, this.state.queueIndex + 1);
        const after = this.state.queue.slice(this.state.queueIndex + 1);
        const queue = before.concat(tracks).concat(after);
        this.setState({ queue });
      }
    }
  }

  onSeekTo(ms) {
    if (this.state.sonos) {
      seekSonosTo(ms);
    } else {
      if (this.currentPlayer.current) {
        this.currentPlayer.current.currentTime = ms / 1000.0;
      } else {
        this.setState({
          currentTime: ms,
          currentTimeSet: ms,
          currentTimeSetAt: Date.now(),
        });
      }
    }
  }

  onSeekBy(ms) {
    if (this.state.sonos) {
      seekSonosBy(ms);
    } else {
      if (this.currentPlayer.current) {
        const t = this.currentPlayer.current.currentTime + ms / 1000.0;
        if (t < 0) {
          this.currentPlayer.current.currentTime = 0;
        } else if (t >= this.currentPlayer.current.duration) {
          const idx = this.state.queueIndex + 1;
          if (idx >= this.state.queue.length) {
            this.currentPlayer.current.pause();
            this.setState({ queueIndex: 0, currentTime: 0 });
          } else {
            this.setState({ queueIndex: idx });
          }
        } else {
          this.currentPlayer.current.currentTime = t;
        }
      } else {
        const t = this.state.currentTime + ms;
        this.setState({
          currentTime: t,
          currentTimeSet: t,
          currentTimeSetAt: Date.now(),
        });
      }
    }
  }

  onSkipBy(count) {
    if (this.state.sonos) {
      skipSonosBy(count);
    } else {
      const idx = this.state.queueIndex + count;
      if (idx < 0 || idx >= this.state.queue.length) {
        if (this.currentPlayer.current) {
          this.currentPlayer.current.pause();
          this.setState({ queueIndex: 0, currentTime: 0 });
        }
      } else {
        this.setState({ queueIndex: idx });
      }
    }
  }

  onSkipTo(idx) {
    if (this.state.sonos) {
      skipSonosTo(idx);
    } else {
      if (idx < 0 || idx >= this.state.queue.length) {
        if (this.currentPlayer.current) {
          this.currentPlayer.current.pause();
          this.setState({ queueIndex: 0, currentTime: 0 });
        }
      } else {
        this.setState({ queueIndex: idx });
      }
    }
  }

  onChangeVolumeBy(delta) {
    if (this.state.sonos) {
      changeSonosVolumeBy(delta);
    } else {
      if (this.currentPlayer.current) {
        let vol = this.currentPlayer.current.volume + delta / 100.0;
        if (vol > 1) {
          vol = 1;
        } else if (vol < 0) {
          vol = 0;
        }
        this.currentPlayer.current.volume = vol;
      } else {
        let vol = this.state.volume + delta;
        if (vol > 100) {
          vol = 100;
        } else if (vol < 0) {
          vol = 0;
        }
        this.setState({ volume: vol });
      }
    }
  }

  onSetVolumeTo(volume) {
    let vol = volume;
    if (vol > 100) {
      vol = 100;
    } else if (vol < 0) {
      vol = 0;
    }
    if (this.state.sonos) {
      setSonosVolumeTo(vol);
    } else {
      if (this.currentPlayer.current) {
        this.currentPlayer.current.volume = vol / 100.0;
      } else {
        this.setState({ volume: vol });
      }
    }
  }

  onTrackEnd() {
    console.debug('onTrackEnd');
    const idx = this.state.queueIndex + 1;
    if (idx >= this.state.queue.length) {
      this.currentPlayer.current.pause();
      this.setState({ queueIndex: 0 });
    } else {
      if (this.nextPlayer.current) {
        this.nextPlayer.current.volume = this.state.volume / 100;
        this.nextPlayer.current.play();
      }
      this.setState({ queueIndex: idx });
    }
  }

  onTimeUpdate(evt) {
    const currentTime = Math.round(evt.target.currentTime * 1000);
    this.setState({
      duration: Math.round(evt.target.duration * 1000),
      currentTime: currentTime,
      currentTimeSet: currentTime,
      currentTimeSetAt: Date.now(),
    }, );
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.state.sonos && this.state.status === 'PLAYING') {
      if (this.currentPlayer.current) {
        const prevTrack = prevState.queue[prevState.queueIndex];
        const track = this.state.queue[this.state.queueIndex];
        if (prevTrack !== track) {
          this.currentPlayer.current.volume = this.state.volume / 100;
          this.currentPlayer.current.play();
        }
      }
    }
    this.saveState();
  }

  componentDidMount() {
    if (!this.state.sonos && this.currentPlayer.current) {
      this.currentPlayer.current.currentTime = this.state.currentTime / 1000.0;
    }
    if (this.state.sonos) {
      this.startupSonos();
    }
  }

  trackUrl(track) {
    let url = `/api/track/${track.persistent_id}`;
    if (track.kind === 'MPEG audio file') {
      url += '.mp3';
    } else if (track.kind === 'Purchased AAC audio file') {
      url += '.m4a';
    }
    return url;
  }

  renderCurrentAudio() {
    if (this.state.sonos) {
      return null;
    }
    const track = this.state.queue[this.state.queueIndex];
    if (track === null || track === undefined) {
      return null;
    }
    return (
      <audio
        key={track.persistent_id}
        ref={this.currentPlayer}
        src={this.trackUrl(track)}
        volume={this.state.volume / 100.0}
        onCanPlay={evt => { evt.target.volume = this.state.volume / 100; this.state.status === 'PLAYING' && evt.target.play(); }}
        onDurationChange={evt => this.setState({ duration: Math.round(evt.target.duration * 1000) })}
        onEnded={this.onTrackEnd}
        onPlaying={evt => this.setState({ status: 'PLAYING' })}
        onPause={() => this.setState({ status: 'PAUSED' })}
        onTimeUpdate={this.onTimeUpdate}
        onVolumeChange={evt => this.setState({ volume: Math.round(100 * evt.target.volume) })}
      />
    );
  }

  renderNextAudio() {
    if (this.state.sonos) {
      return null;
    }
    const track = this.state.queue[this.state.queueIndex + 1];
    if (track === null || track === undefined) {
      return null;
    }
    return (
      <audio
        key={track.persistent_id}
        ref={this.nextPlayer}
        src={this.trackUrl(track)}
        preload="auto"
      />
    );
  }

  render() {
    const props = {
      status: this.state.status,
      queue: this.state.queue,
      queueIndex: this.state.queueIndex,
      duration: this.state.duration,
      currentTime: this.state.currentTime,
      volume: this.state.volume,
      sonos: this.state.sonos,
      onPlay: this.onPlay,
      onPause: this.onPause,
      onPlay: this.onPlay,
      onPause: this.onPause,
      onSeekTo: this.onSeekTo,
      onSeekBy: this.onSeekBy,
      onSkipTo: this.onSkipTo,
      onSkipBy: this.onSkipBy,
      onReplaceQueue: this.onReplaceQueue,
      onAppendToQueue: this.onAppendToQueue,
      onInsertIntoQueue: this.onInsertIntoQueue,
      onChangeVolumeBy: this.onChangeVolumeBy,
      onSetVolumeTo: this.onSetVolumeTo,
      onEnableSonos: this.onEnableSonos,
      onDisableSonos: this.onDisableSonos,
      ...this.props,
    };
    return (
      <Fragment>
        {this.renderCurrentAudio()}
        {this.renderNextAudio()}
        { this.props.mobile ? (
          <MobileSkin {...props} />
        ) : (
          <DesktopSkin {...props} />
        ) }
      </Fragment>
    );
  }
}
