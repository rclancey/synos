import React, { Fragment } from 'react';
import _ from 'lodash';
import { trackDB } from '../lib/trackdb';
//import { Controls } from './Desktop/Controls';
import { PlaylistBrowser } from './PlaylistBrowser';
import { TrackBrowser } from './TrackBrowser';
import { ProgressBar } from './ProgressBar';
import { DISTINGUISHED_KINDS, PLAYLIST_ORDER } from '../lib/distinguished_kinds';

export class Library extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      trackCount: 1,
      loaded: 0,
      tracks: [],
      playlists: [],
      playlist: null,
      openFolders: {},
    };
    this.onSearch = this.onSearch.bind(this);
    this.onSelectPlaylist = this.onSelectPlaylist.bind(this);
    this.onTogglePlaylist = this.onTogglePlaylist.bind(this);
    this.onMovePlaylist = this.onMovePlaylist.bind(this);
    this.onAddToPlaylist = this.onAddToPlaylist.bind(this);
    this.onReorderTracks = this.onReorderTracks.bind(this);
    this.onDeleteTracks = this.onDeleteTracks.bind(this);
    this.onTrackPlay = this.onTrackPlay.bind(this);
    this.onConfirm = this.onConfirm.bind(this);
    window.trackDB = trackDB;
  }

  loadTrackPage(page, size, since) {
    return this.props.api.loadTracks(page, size, since)
      .then(tracks => {
        if (tracks.length === 0) {
          return;
        }
        return trackDB.updateTracks(tracks)
          .then(() => {
            let music = tracks;/*.filter(track => {
              return !track.podcast && !track.tv_show && !track.movie && !track.music_video;
            });*/
            music = this.state.tracks.concat(music);
            if (this.state.sorting) {
              music = _.sortBy(music, [track => track[this.state.sorting]]);
            }
            const loaded = this.state.loaded + tracks.length;
            return new Promise(resolve => {
              this.setState({ tracks: music, loaded }, resolve);
            });
          });
      });
  }

  loadTracks(page, since) {
    const size = 100;
    this.loadTrackPage(page, size, since)
      .then(() => this.loadTracks(page+1, since))
      .catch(err => {
        console.error(err);
        if (err === "204") {
          if (this.props.onLoad !== null && this.props.onLoad !== undefined) {
            this.props.onLoad();
          }
          setTimeout(() => {
            let newest = 0;
            this.state.tracks.forEach(track => {
              if (track.date_added > newest) {
                newest = track.date_added;
              }
              if (track.date_modified > newest) {
                newest = track.date_modified;
              }
            });
            this.loadTracks(1, newest);
          }, 60000);
        }
      });
  }

  loadPlaylists() {
    const restructure = playlist => {
      const pl = Object.assign({}, playlist);
      pl.title = pl.name;
      delete(pl.children);
      if (pl.distinguished_kind) {
        pl.kind = DISTINGUISHED_KINDS[pl.distinguished_kind]
      } else if (pl.folder) {
        pl.kind = 'folder';
        pl.children = playlist.children ? _.sortBy(playlist.children.map(restructure), [(x => !x.folder), (x => x.name.toLowerCase())]) : [];
      } else if (pl.genius_track_id) {
        pl.kind = 'genius';
      } else if (pl.smart) {
        pl.kind = 'smart';
      } else {
        pl.kind = 'playlist';
      }
      return pl;
    };
    return this.props.api.loadPlaylists()
      .then(data => {
        const playlists = _.sortBy(data.map(restructure).filter(x => PLAYLIST_ORDER[x.kind] !== -1), [(x => PLAYLIST_ORDER[x.kind] || 999), (x => x.name.toLowerCase())]);
        this.setState({ playlists });
      });
  }

  updatePlaylist(pl) {
    let updated = null;
    const recurse = (pls) => {
      return pls.map(xpl => {
        const upl = Object.assign({}, xpl);
        if (upl.persistent_id === pl.persistent_id) {
          if (pl.tracks) {
            upl.tracks = pl.tracks;
          }
          upl.name = pl.name;
          upl.children = pl.children;
          updated = upl;
          console.debug('updated playlist %o', upl);
        } else if (upl.children) {
          upl.children = recurse(upl.children);
        }
        return upl;
      });
    };
    const update = { playlists: recurse(this.state.playlists) };
    if (updated && this.state.playlist && this.state.playlist.persistent_id === updated.persistent_id) {
      update.playlist = updated;
    }
    this.setState(update);
  }

  setPlaylistTracks(playlist, trackIds) {
    const tracksById = {};
    this.state.tracks.forEach(track => tracksById[track.persistent_id] = track);
    const tracks = trackIds.map(id => tracksById[id]).filter(track => !!track);
    const pl = Object.assign({}, playlist, { tracks });
    this.updatePlaylist(pl);
    return pl;
  }

  loadPlaylistTracks(pl) {
    if (pl.tracks) {
      return Promise.resolve(pl);
    }
    return this.props.api.loadPlaylistTrackIds(pl)
      .then(ids => this.setPlaylistTracks(pl, ids));
  }

  componentDidMount() {
    this.loadPlaylists();
    const progressCallback = tracks => this.setState({ tracks: tracks.slice(0), loaded: tracks.length });
    trackDB.countTracks()
      .then(count => this.setState({ trackCount: count+1 }))
      .then(() => trackDB.loadTracks(200, progressCallback))
      .then(tracks => {
        return new Promise(resolve => this.setState({ tracks }, resolve));
      })
      .then(() => trackDB.getNewest())
      .then(newest => {
        this.props.api.loadTrackCount(newest).then(trackCount => {
          this.setState({ trackCount }, () => this.loadTracks(1, newest));
        });
      });
  }

  onTrackPlay({ event, index, rowData, list }) {
    console.debug('play %o', { event, index, rowData, list });
    this.setQueue(list.slice(index));//.then(() => this.advanceQueue());
    //this.setState({ currentTrack: rowData });
  }

  onSearch(search) {
    this.setState({ search });
  }

  onSelectPlaylist(playlist) {
    if (playlist === null) {
      this.setState({ playlist: null });
      this.props.onViewPlaylist(null);
    } else if (!playlist.folder) {
      this.props.onViewPlaylist(playlist.persistent_id);
      this.loadPlaylistTracks(playlist)
        .then(playlist => this.setState({ playlist }));
    }
  }

  onTogglePlaylist(playlist) {
    console.debug('toggling %o', playlist);
    const openFolders = Object.assign({}, this.state.openFolders);
    if (openFolders[playlist.persistent_id]) {
      delete(openFolders[playlist.persistent_id]);
    } else {
      openFolders[playlist.persistent_id] = true;
    }
    this.setState({ openFolders });
  }

  onMovePlaylist(src, dst) {
    const recurse = (pls) => {
      return pls.map(pl => {
        if (!pl.children && (dst === null || pl.persistent_id !== dst.persistent_id)) {
          return pl;
        }
        let children = pl.children ? pl.children : [];
        children = children.filter(child => child.persistent_id !== src.persistent_id);
        children = recurse(children);
        if (dst !== null && pl.persistent_id === dst.persistent_id) {
          children = children.concat([src]);
          children = _.sortBy(children, [(x => !x.folder), (x => x.name.toLowerCase())]);
        }
        return Object.assign({}, pl, { children });
      });
    };
    let root = this.state.playlists;
    console.debug('moving %o to %o in %o', src, dst, root);
    root = root.filter(x => x.persistent_id !== src.persistent_id);
    root = recurse(root);
    if (dst === null) {
      root = root.concat([src]);
      root = _.sortBy(root, [(x => !x.folder), (x => x.name.toLowerCase())]);
    }
    console.debug('playlists now %o', root);
    this.setState({ playlists: root });
  }

  onAddToPlaylist(dst, tracks) {
    return this.props.api.addToPlaylist(dst, tracks)
      .then(ids => this.setPlaylistTracks(dst, ids));
  }

  onReorderTracks(playlist, targetIndex, sourceIndices) {
    return this.props.api.reorderTracks(playlist, targetIndex, sourceIndices)
      .then(ids => this.setPlaylistTracks(playlist, ids));
  }

  onDeleteTracks(playlist, selected) {
    if (playlist === null || playlist === undefined) {
      return Promise.resolve(null);
    }
    return this.props.api.deletePlaylistTracks(playlist, selected)
      .then(ids => this.setPlaylistTracks(playlist, ids));
  }

  onConfirm(message, callback) {
    this.setState({ confirming: { message, callback } });
  }

  clearQueue() {
    return this.setQueue([]);
  }

  setQueue(tracks) {
    this.props.onReplaceQueue(tracks);
    /*
    const queue = {
      tracks: tracks,
      index: -1,
    };
    return new Promise(resolve => this.setState({ queue }, resolve));
    */
  }

  appendToQueue(tracks) {
    return new Promise(resolve => {
      const queue = Object.assign({}, this.state.queue);
      queue.tracks = queue.tracks.concat(tracks);
      this.setState({ queue }, resolve);
    })
  }

  insertIntoQueue(tracks) {
    return new Promise(resolve => {
      const queue = Object.assign({}, this.state.queue);
      const before = queue.tracks.slice(0, queue.index+1);
      const after = queue.tracks.slice(queue.index+1);
      queue.tracks = before.concat(tracks).concat(after);
      this.setState({ queue }, resolve);
    });
  }

  reorderQueue(srcIndex, dstIndex) {
    return new Promise(resolve => {
      const queue = Object.assign({}, this.state.queue);
      if (srcIndex >= 0 && srcIndex < queue.tracks.length) {
        const track = queue.tracks[srcIndex];
        const before = queue.tracks.slice(0, srcIndex);
        const after = queue.tracks.slice(srcIndex+1);
        const tracks = before.concat(after);
        tracks.splice(dstIndex, 0, track);
        queue.tracks = tracks;
        this.setState({ queue }, resolve);
      } else {
        resolve();
      }
    });
  }

  advanceQueue() {
    return new Promise(resolve => {
      const queue = Object.assign({}, this.state.queue);
      queue.index = Math.min(queue.index + 1, queue.tracks.length);
      this.setState({ queue }, resolve);
    });
  }

  rewindQueue() {
    return new Promise(resolve => {
      const queue = Object.assign({}, this.state.queue);
      queue.index = Math.max(queue.index - 1, 0);
      this.setState({ queue }, resolve);
    });
  }

  render() {
    return (
      <Fragment>
        <div key="library" className="library">
          <PlaylistBrowser
            playlists={this.state.playlists}
            openFolders={this.state.openFolders}
            selected={this.state.playlist ? this.state.playlist.persistent_id : null}
            onChange={playlists => this.setState({ playlists })}
            onSelect={this.onSelectPlaylist}
            onToggle={this.onTogglePlaylist}
            onMovePlaylist={this.onMovePlaylist}
            onAddToPlaylist={this.onAddToPlaylist}
            onConfirm={this.onConfirm}
          />
          <TrackBrowser
            tracks={this.state.playlist ? this.state.playlist.tracks : this.state.tracks}
            playlist={this.state.playlist}
            onReorderTracks={this.onReorderTracks}
            onDeleteTracks={this.onDeleteTracks}
            onConfirm={this.onConfirm}
            onPlay={this.onTrackPlay}
            search={this.props.search}
          />
        </div>
        <ProgressBar key="progress" total={this.state.trackCount} complete={this.state.loaded} />
        { this.state.confirming ? (
          <Confirm
            message={this.state.confirming.message}
            onConfirm={() => { this.setState({ confirming: null }); this.state.confirming.callback(); }}
            onCancel={() => this.setState({ confirming: null })}
          />
        ) : null }
      </Fragment>
    );
  }
}

const Confirm = ({ message, onConfirm, onCancel }) => (
  <div className="cover">
    <div className="padding" />
    <div className="dialog">
      <p>{message}</p>
      <p style={{ textAlign: 'right' }}>
        <input type="button" className="dflt" value="Cancel" onClick={onCancel} />
        <input type="button" style={{ borderColor: 'red', color: 'red' }} value="Proceed" onClick={onConfirm} />
      </p>
    </div>
    <div className="padding" />
  </div>
);

