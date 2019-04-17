import React from 'react';
import { displayTime } from '../lib/columns';
import { Queue } from './Queue';
import { Playback } from './Playback';

export class NowPlaying extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      duration: 0,
      currentTime: 0,
    };
    this.playbackRef = React.createRef();
    window.playbackRef = this.playbackRef;
    this.timeUpdate = this.timeUpdate.bind(this);
    this.onPlaying = this.onPlaying.bind(this);
    this.onComplete = this.onComplete.bind(this);
    this.seekTo = this.seekTo.bind(this);
  }

  timeUpdate(evt) {
    const node = evt.nativeEvent.target;
    this.setState({ currentTime: node.currentTime, duration: node.duration });
  }

  onPlaying() {
    this.setState({ playing: true });
    this.props.onPlaying();
  }

  onComplete() {
    this.setState({ playing: false });
    this.props.onComplete();
  }

  audioNode() {
    let node = this.playbackRef.current;
    if (!node) {
      return null;
    }
    node = node.currentPlayer.current;
    if (!node) {
      return null;
    }
    return node;
  }

  seekTo(evt) {
    console.debug(evt.nativeEvent);
    const audioNode = this.audioNode();
    let l = 0;
    let node = evt.target;
    while (node !== null && node !== undefined) {
      l += node.offsetLeft;
      node = node.offsetParent;
    }
    const xevt = Object.assign({}, evt);
    const x = evt.pageX - l;
    const w = evt.target.offsetWidth;
    const t = audioNode.duration * x / w;
    console.debug({ xevt, l, layerX: evt.pageX, x, w, t, duration: audioNode.duration });
    audioNode.currentTime = t;
  }

  componentDidUpdate(prevProps) {
    const node = this.audioNode();
    if (node) {
      if (prevProps.paused !== this.props.paused) {
        if (this.props.paused) {
          node.pause();
        } else {
          node.play();
        }
      }
    }
  }

  render() {
    const track = this.props.queue ? this.props.queue[this.props.index] : null;
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
    const dur = this.state.duration;
    const cur = this.state.currentTime;
    const pct = (dur > 0 ? 100 * cur / dur : 0);
    return (
      <div>
        <Playback
          ref={this.playbackRef}
          currentTrack={this.props.queue[this.props.index]}
          nextTrack={this.props.queue[this.props.index+1]}
          onDurationChange={this.timeUpdate}
          onAdvanceQueue={this.props.onAdvanceQueue}
          onPause={() => this.setState({ playing: false })}
          onPlaying={() => this.setState({ playing: true })}
          onSeeked={this.timeUpdate}
          onTimeUpdate={this.timeUpdate}
        />
        {/*
          onCanPlayThrough={evt => console.debug(evt.nativeEvent)}
          onEmptied={evt => console.debug(evt.nativeEvent)}
          onLoadedData={evt => console.debug(evt.nativeEvent)}
          onLoadedMetadata={evt => console.debug(evt.nativeEvent)}
          onPlay={evt => console.debug(evt.nativeEvent)}
          onRateChange={evt => console.debug(evt.nativeEvent)}
          onSeeking={evt => console.debug(evt.nativeEvent)}
          onStalled={evt => console.debug(evt.nativeEvent)}
          onVolumeChange={evt => console.debug(evt.nativeEvent)}
          onWaiting={evt => console.debug(evt.nativeEvent)}
        */}
        <div
          className="coverart"
          style={{ backgroundImage: `url(/api/cover/${track.persistent_id})` }}
        />
        <div
          style={{
            flex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              flex: 100,
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            <div className="timer">
              <div style={{ flex: 100 }}></div>
              <div className="currentTime">
                {displayTime(1000 * this.state.currentTime)}
              </div>
            </div>
            <div className="trackinfo">
              <div className="name">{track.name}</div>
              <div className="artist">
                {track.artist}
                {' - '}
                {track.album}
              </div>
            </div>
            <div className="timer">
              <div style={{ flex: 100 }}></div>
              <div className="currentTime">
                {'-'+displayTime(1000 * (this.state.duration - this.state.currentTime))}
              </div>
            </div>
          </div>
          <div className="progressContainer" onClick={this.seekTo}>
            <div className="progress" style={{width: `${pct}%`}} />
          </div>
        </div>
      </div>
    );
  }
}

export class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      showQueue: false,
    };
    this.nowPlayingRef = React.createRef();
    this.queueRef = React.createRef();
    this.beginSeek = this.beginSeek.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
  }

  audioNode() {
    let node = this.nowPlayingRef.current;
    if (!node) {
      return null;
    }
    node = node.playbackRef.current;
    if (!node) {
      return null;
    }
    node = node.currentPlayer.current;
    if (!node) {
      return null;
    }
    return node;
  }

  beginSeek(dir) {
    const audioNode = this.audioNode();
    if (!audioNode) {
      return;
    }
    document.addEventListener('mouseup', () => this.setState({ seeking: false }), { once: true });
    this.setState({ seeking: true }, () => {
      const startTime = Date.now();
      this.interval = setInterval(() => {
        if (this.state.seeking) {
          const cur = audioNode.currentTime;
          const dur = audioNode.duration;
          const t = cur + dir;
          if (t < 0) {
            t = 0;
          } else if (t >= dur) {
            t = dur - 1;
          }
          audioNode.currentTime = t;
        } else {
          clearInterval(this.interval);
          const t = Date.now() - startTime;
          if (t < 250) {
            if (dir < 0) {
              this.seekTo(0);
            } else {
              this.seekTo(1);
            }
          }
        }
      }, 40);
    });
  }

  seekTo(t) {
    const audioNode = this.audioNode();
    if (!audioNode) {
      return;
    }
    audioNode.currentTime = audioNode.duration * t;
  }

  play() {
    if (this.props.queue) {
      this.setState({ playing: true });
      if (this.props.index < 0) {
        this.props.onAdvanceTrack();
      }
    }
  }

  pause() {
    this.setState({ playing: false });
  }

  componentDidUpdate(prevProps) {
    const prevTrack = prevProps.queue[prevProps.index];
    const track = this.props.queue[this.props.index];
    if (prevTrack !== track && !this.state.playing) {
      this.setState({ playing: true });
    }
  }

  toggleQueue() {
    if (this.state.showQueue) {
      this.setState({ showQueue: false });
    } else {
      let node = this.queueRef.current;
      let x = node.offsetWidth / 2;
      let y = node.offsetHeight;
      while (node !== null && node !== undefined) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      this.setState({ showQueue: true, queueX: x, queueY: y });
    }
  }

  render() {
    const { search, onSearch } = this.props;
    const track = this.props.queue[this.props.index];
    return (
      <div className="controls">
        <div className="playpause">
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '1em' }}>
            <div style={{ flex: 2 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
              <div className="buttons">
                <div className="rewind" onMouseDown={() => this.beginSeek(-0.2)}>
                  <div />
                  <div />
                </div>
                { track && this.state.playing ? (
                  <div className="pause" onClick={this.pause} />
                ) : (
                  <div className="play" onClick={this.play} />
                )}
                <div className="fastforward" onMouseDown={() => this.beginSeek(0.2)}>
                  <div />
                  <div />
                </div>
              </div>
            </div>
            <div style={{ flex: 2 }} />
          </div>
        </div>
        <div className="nowplaying">
          <NowPlaying
            ref={this.nowPlayingRef}
            queue={this.props.queue}
            index={this.props.index}
            paused={!this.state.playing}
            onAdvanceQueue={this.props.onAdvanceQueue}
          />
        </div>
        <div className="search">
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 2 }} />
            <div ref={this.queueRef} className="queueMenu" onClick={() => this.toggleQueue()}>
              <div>1<span className="row" /></div>
              <div>2<span className="row" /></div>
              <div>3<span className="row" /></div>
            </div>
            <div style={{ flex: 2 }} />
            { this.state.showQueue ? [
              (<div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9 }} onClick={() => this.toggleQueue()} />),
              (<Queue
                x={this.state.queueX}
                y={this.state.queueY}
                tracks={this.props.queue}
                index={this.props.index}
              />)
            ] : null }
          </span>
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
            <div style={{ flex: 2 }} />
          </div>
        </div>
      </div>
    );
  }
}
