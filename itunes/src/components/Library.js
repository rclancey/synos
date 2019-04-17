import React from 'react';
import _ from 'lodash';
import { trackDB } from '../lib/trackdb';
import { Controls } from './Controls';
import { PlaylistBrowser } from './PlaylistBrowser';
import { TrackBrowser } from './TrackBrowser';
import { ProgressBar } from './ProgressBar';
import { DISTINGUISHED_KINDS, PLAYLIST_ORDER } from '../lib/distinguished_kinds';

export class Library extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: null,
      queue: {
        index: -1,
        tracks: [],
      },
      trackCount: 1,
      loaded: 0,
      tracks: [],
      playlists: [],
      playlist: null,
      openFolders: {},
      currentTrack: null,
    };
    this.onSearch = this.onSearch.bind(this);
    this.onSelectPlaylist = this.onSelectPlaylist.bind(this);
    this.onTogglePlaylist = this.onTogglePlaylist.bind(this);
    this.onMovePlaylist = this.onMovePlaylist.bind(this);
    this.onAddToPlaylist = this.onAddToPlaylist.bind(this);
    this.onReorderTracks = this.onReorderTracks.bind(this);
    this.onTrackPlay = this.onTrackPlay.bind(this);
  }

  loadTrackPage(page, size, since) {
    /*
    if (page > 10) {
      throw new Error("404");
    }
    */
    //const url = `/api/library/tracks?start=${page*size}&count=${size}`;
    //const url = `/api/library/tracks/${page}.json`;
    //const url = `/jsonlib/${page}.json`;
    const url = `/api/tracks?page=${page}&count=${size}&since=${since}`;
    return fetch(url, { method: 'GET' })
      .then(resp => {
        if (resp.status === 204) {
          throw new Error("204");
        }
        if (resp.status !== 200) {
          throw new Error(resp.statusText);
        }
        return resp.json();
      })
      .then(tracks => {
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

  loadTrackCount(since) {
    //const url = '/jsonlib/trackCount.json';
    const url = `/api/trackCount?since=${since}`;
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json());
  }

  loadTracks(page, since) {
    const size = 100;
    this.loadTrackPage(page, size, since)
      .then(() => { if (this.state.loaded < this.state.trackCount) { this.loadTracks(page+1, since) } })
      .catch(err => {
        console.debug(err);
        this.props.onLoad();
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
        pl.children = playlist.children ? _.sortBy(playlist.children.map(restructure), [(x => !x.folder), (x => x.title.toLowerCase())]) : [];
      } else if (pl.genius_track_id) {
        pl.kind = 'genius';
      } else if (pl.smart) {
        pl.kind = 'smart';
      } else {
        pl.kind = 'playlist';
      }
      return pl;
    };
    //const url = '/jsonlib/playlists.json';
    const url = '/api/playlists';
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(data => {
        const playlists = _.sortBy(data.map(restructure).filter(x => PLAYLIST_ORDER[x.kind] !== -1), [(x => PLAYLIST_ORDER[x.kind] || 999), (x => x.title.toLowerCase())]);
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
          upl.title = pl.title;
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

  loadPlaylistTracks(pl) {
    if (pl.tracks) {
      return Promise.resolve(pl);
    }
    const playlist = Object.assign({}, pl);
    //const url = `/jsonlib/${pl.persistent_id}.json`;
    const url = `/api/playlist/${pl.persistent_id}`;
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(ids => {
        const tracksById = {};
        this.state.tracks.forEach(track => tracksById[track.persistent_id] = track);
        const tracks = ids.map(id => tracksById[id]).filter(track => !!track);
        playlist.tracks = tracks;
        this.updatePlaylist(playlist);
        return playlist;
      });
  }

  /*
  loadPlaylistTracks(pl) {
    if (pl.tracks) {
      return Promise.resolve(pl);
    }
    const playlist = Object.assign({}, pl);
    return fetch(`/jsonlib/${pl.persistent_id}.json`, { method: 'GET' })
      .then(resp => resp.json())
      .then(ids => {
        const tracksById = {};
        this.state.tracks.forEach(track => tracksById[track.persistent_id] = track);
        const tracks = ids.map(id => tracksById[id]).filter(track => !!track);
        playlist.tracks = tracks;
        return new Promise(resolve => this.setState({ playlist }, () => resolve((pl)));
      });
  }
  */

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
        this.loadTrackCount(newest).then(trackCount => {
          this.setState({ trackCount }, () => this.loadTracks(1, newest));
        });
      });
  }

  onTrackPlay({ event, index, rowData, list }) {
    console.debug('play %o', { event, index, rowData, list });
    this.setQueue(list.slice(index)).then(() => this.advanceQueue());
    //this.setState({ currentTrack: rowData });
  }

  onSearch(search) {
    this.setState({ search });
  }

  onSelectPlaylist(playlist) {
    if (playlist === null) {
      this.setState({ playlist: null });
    } else if (!playlist.folder) {
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
          children = _.sortBy(children, [(x => !x.folder), (x => x.title.toLowerCase())]);
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
      root = _.sortBy(root, [(x => !x.folder), (x => x.title.toLowerCase())]);
    }
    console.debug('playlists now %o', root);
    this.setState({ playlists: root });
  }

  onAddToPlaylist(dst, tracks) {
    this.loadPlaylistTracks(dst)
      .then(pl => this.updatePlaylist(Object.assign({}, pl, { tracks: pl.tracks.concat(tracks) })));
    return { playlist: dst, tracks: tracks };
  }

  onReorderTracks(playlist, targetIndex, sourceIndices) {
    console.debug('onReorderTracks(%o)', { playlist, targetIndex, sourceIndices });
    const target = playlist.tracks[targetIndex];
    const sources = sourceIndices.map(i => playlist.tracks[i]);
    const tracks = playlist.tracks.filter((t, i) => !sourceIndices.includes(i));
    const newIdx = tracks.findIndex(t => t === target);
    const before = newIdx === -1 ? [] : tracks.slice(0, newIdx+1);
    const after = newIdx === -1 ? tracks.slice(0) : tracks.slice(newIdx+1);
    const newTracks = before.concat(sources).concat(after);
    const pl = Object.assign({}, playlist, { tracks: newTracks });
    console.debug({ playlist, targetIndex, sourceIndices, target, sources, tracks, newIdx, before, after, newTracks, pl });
    this.updatePlaylist(pl);
    return pl;
  }

  clearQueue() {
    return this.setQueue([]);
  }

  setQueue(tracks) {
    const queue = {
      tracks: tracks,
      index: -1,
    };
    return new Promise(resolve => this.setState({ queue }, resolve));
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
    return [
      <div key="library" className="library">
        <Controls
          search={this.state.search}
          track={this.state.currentTrack}
          queue={this.state.queue.tracks}
          index={this.state.queue.index}
          onAdvanceQueue={() => this.advanceQueue()}
          onRewindQueue={() => this.rewindQueue()}
          onSearch={this.onSearch}
        />
        <div className="dataContainer">
          <PlaylistBrowser
            playlists={this.state.playlists}
            openFolders={this.state.openFolders}
            selected={this.state.playlist ? this.state.playlist.persistent_id : null}
            onChange={playlists => this.setState({ playlists })}
            onSelect={this.onSelectPlaylist}
            onToggle={this.onTogglePlaylist}
            onMovePlaylist={this.onMovePlaylist}
            onAddToPlaylist={this.onAddToPlaylist}
          />
          <TrackBrowser
            tracks={this.state.playlist ? this.state.playlist.tracks : this.state.tracks}
            playlist={this.state.playlist}
            onReorderTracks={this.onReorderTracks}
            onPlay={this.onTrackPlay}
            search={this.state.search}
          />
        </div>
      </div>,
      <ProgressBar key="progress" total={this.state.trackCount} complete={this.state.loaded} />
    ];
  }
}

