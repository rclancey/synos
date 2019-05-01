import React from 'react';
import { PlaylistList } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList } from './AlbumList';
import { GenreList } from './GenreList';
import { PodcastList } from './PodcastList';
import { AudiobookList } from './AudiobookList';
import { TrackMenu } from './TrackMenu';
import { MobileSonosNowPlaying } from './MobileSonosNowPlaying';

export class HomeList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: null,
      trackMenuTrack: null,
      playlistMenuTracks: null,
      queue: [],
      queueIndex: 0,
      sonos: false,
      status: 'PAUSED',
      currentTime: 0,
      currentTimeSet: 0,
      currentTimeSetAt: 0,
      volume: 0,
    };
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onTrackMenu = this.onTrackMenu.bind(this);
    this.onPlaylistMenu = this.onPlaylistMenu.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onPause = this.onPause.bind(this);
    this.onSeek = this.onSeek.bind(this);
    this.onSeekBy = this.onSeekBy.bind(this);
    this.onQueueNext = this.onQueueNext.bind(this);
    this.onQueue = this.onQueue.bind(this);
    this.onReplaceQueue = this.onReplaceQueue.bind(this);
    this.onSkip = this.onSkip.bind(this);
  }

  shutdownSonos() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  startupSonos() {
    let uri = '';
    const loc = document.location;
    if (loc.protocol == 'https:') {
      uri = 'wss://';
    } else {
      uri = 'ws://';
    }
    uri += loc.host;
    uri += '/api/sonos/ws';
    return new Promise(resolve => {
      const ws = new WebSocket(uri);
      ws.onopen = evt => {
        console.debug('ws open: %o', evt);
        this.ws = ws;
        resolve();
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
        if (Object.keys(update).length > 0) {
          this.setState(update);
        }
      };
      ws.onerror = evt => {
        console.debug('ws error: %o', evt);
        ws.close();
      };
      ws.onclose = evt => {
        console.debug('ws close: %o', evt);
        if (this.state.sonos) {
          this.startupSonos();
        }
      };
      /*
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
      */
      /*
      this.playHeadInterval = setInterval(() => {
        if (this.state.status == 'PLAYING') {
          const t = this.state.currentTimeSet + (Date.now() - this.state.currentTimeSetAt);
          this.setState({ currentTime: t });
        }
      }, 500);
      */
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.sonos !== this.state.sonos) {
      if (this.state.sonos) {
        this.startupSonos()
          .then(() => this.transferQueue());
      } else {
        this.shutdownSonos();
      }
    }
  }

  transferQueue() {
    const tracks = this.state.queue.map(track => track.persistent_id);
    const idx = this.state.queueIndex;
    fetch('/api/sonos/queue', {
      method: 'POST',
      body: JSON.stringify(tracks),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => fetch('/api/sonos/skip', {
        method: 'POST',
        body: JSON.stringify(idx),
        headers: { 'Content-Type': 'application/json' },
      })
      .then(() => fetch('/api/sonos/seek', {
        method: 'POST',
        body: JSON.stringify(ms),
        headers: { 'Content-Type': 'application/json' },
      });
  }

  onOpen(screen) {
    this.setState({ screen });
  }

  onClose() {
    this.setState({ screen: null });
  }

  onTrackMenu(track) {
    this.setState({ trackMenuTrack: track });
  }

  onPlaylistMenu(tracks) {
    this.setState({ playlistMenuTracks: tracks });
  }

  onPlay() {
    if (this.state.sonos) {
      fetch('/api/sonos/play', { method: 'POST' });
    } else {
      this.setState({ status: 'PLAYING' });
    }
  }

  onPause() {
    if (this.state.sonos) {
      fetch('/api/sonos/pause', { method: 'POST' });
    } else {
      this.setState({ status: 'PAUSED' });
    }
  }

  onSeek(ms) {
    if (this.state.sonos) {
      fetch('/api/sonos/seek', {
        method: 'POST',
        body: JSON.stringify(ms),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // TODO
    }
  }

  onSeekBy(ms) {
    if (this.state.sonos) {
      fetch('/api/sonos/seek', {
        method: 'PUT',
        body: JSON.stringify(ms),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // TODO
    }
  }

  onQueueNext(tracks) {
    if (this.state.sonos) {
      fetch('/api/sonos/queue', {
        method: 'PATCH',
        body: JSON.stringify(tracks.map(track => track.persistent_id)),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      let queue;
      if (this.state.queueIndex !== null && this.state.queueIndex + 1 < this.state.queue.length) {
        queue = this.state.queue.slice(0, this.state.queueIndex + 1);
        queue = queue.concat(tracks);
        queue = queue.concat(this.state.queue.slice(this.state.queueIndex + 1));
      } else {
        queue = this.state.queue.concat(tracks);
      }
      this.setState({ queue });
    }
  }

  onQueue(tracks) {
    if (this.state.sonos) {
      fetch('/api/sonos/queue', {
        method: 'PUT',
        body: JSON.stringify(tracks.map(track => track.persistent_id)),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const queue = this.state.queue.concat(tracks);
      this.setState({ queue });
    }
  }

  onReplaceQueue(tracks) {
    if (this.state.sonos) {
      fetch('/api/sonos/queue', {
        method: 'POST',
        body: JSON.stringify(tracks.map(track => track.persistent_id)),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      this.setState({ queue: trqcks, queueIndex: 0 });
    }
  }

  onSkip(dir) {
    if (this.state.sonos) {
      fetch('/api/sonos/skip', {
        method: 'POST',
        body: JSON.stringfy(dir),
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      let queueIndex = this.state.queueIndex + dir;
      if (queueIndex < 0 || queueIndex >= this.state.queue.length) {
        queueIndex = 0;
      }
      this.setState({ queueIndex });
    }
  }

  renderScreen() {
    if (this.state.screen == 'playlists') {
      return (
        <PlaylistList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'artists') {
      return (
        <ArtistList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'albums') {
      return (
        <AlbumList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'genres') {
      return (
        <GenreList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'podcasts') {
      return (
        <PodcastList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'audiobooks') {
      return (
        <AudiobookList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    return (
      <div className="home">
        <div className="header">
          <div className="title">Library</div>
        </div>
        <div className="items">
          <div className="item" onClick={() => this.onOpen('playlists')}>
            <div className="icon playlists" />
            <div className="title">Playlists</div>
          </div>
          <div className="item" onClick={() => this.onOpen('artists')}>
            <div className="icon artists" />
            <div className="title">Artists</div>
          </div>
          <div className="item" onClick={() => this.onOpen('albums')}>
            <div className="icon albums" />
            <div className="title">Albums</div>
          </div>
          <div className="item" onClick={() => this.onOpen('genres')}>
            <div className="icon genres" />
            <div className="title">Genres</div>
          </div>
          <div className="item" onClick={() => this.onOpen('podcasts')}>
            <div className="icon podcasts" />
            <div className="title">Podcasts</div>
          </div>
          <div className="item" onClick={() => this.onOpen('audiobooks')}>
            <div className="icon audiobooks" />
            <div className="title">Audiobooks</div>
          </div>
          <div className="item" onClick={() => this.onOpen('recent')}>
            <div className="icon recent" />
            <div className="title">Recently Added</div>
          </div>
          <div className="item" onClick={() => this.onOpen('purchased')}>
            <div className="icon purchased" />
            <div className="title">Purchases</div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="mobile">
        {this.renderScreen()}
        <MobileSonosNowPlaying
          status={this.state.status}
          queue={this.state.queue}
          queueIndex={this.state.queueIndex}
          currentTime={this.state.currentTime}
          currentTimeSet={this.state.currentTimeSet}
          currentTimeSetAt={this.state.currentTimeSetAt}
          volume={this.state.volume}
          onPlay={this.onPlay}
          onPause={this.onPause}
          onSkip={this.onSkip}
          onSeek={this.onSeek}
          onSeekBy={this.onSeekBy}
        />
        {this.state.trackMenuTrack ? (
          <TrackMenu
            track={this.state.trackMenuTrack}
            onClose={() => this.setState({ trackMenuTrack: null })}
            onPlay={this.onPlay}
            onQueueNext={this.onQueueNext}
            onQueue={this.onQueue}
            onReplaceQueue={this.onReplaceQueue}
          />
        ) : null}
      </div>
    );
  }
}

