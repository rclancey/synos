import { APIBase } from './api';

export class JookiAPI extends APIBase {
  constructor(onLoginRequired) {
    super(onLoginRequired);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.skipTo = this.skipTo.bind(this);
    this.skipBy = this.skipBy.bind(this);
    this.seekTo = this.seekTo.bind(this);
    this.seekBy = this.seekBy.bind(this);
    this.setPlaylist = this.setPlaylist.bind(this);
    this.setVolumeTo = this.setVolumeTo.bind(this);
    this.changeVolumeBy = this.changeVolumeBy.bind(this);
    this.replaceQueue = null;
    this.appendToQueue = null;
    this.insertIntoQueue = null;
  }

  loadState() {
    const url = '/api/jooki/state';
    return this.get(url);
  }

  loadTracks(page, count, since) {
    return this.loadState()
      .then(state => {
        return Object.entries(state.tracks).map(entry => {
          return Object.assign({}, entry[1], { persistent_id: entry[0] });
        });
      });
  }

  loadTrackCount(since) {
    return this.loadTracks(0, 0, since)
      .then(tracks => tracks.length);
  };

  loadPlaylists() {
    const url = '/api/jooki/playlists';
    return this.get(url);
  };

  loadPlaylistTrackIds(pl) {
    return this.loadState()
      .then(state => {
        if (state.db.playlists[pl.persistent_id]) {
          return state.db.playlists[pl.persistent_id].tracks;
        }
        return [];
      });
  }

  copyPlaylist(pl) {
    const url = '/api/jooki/copy';
    const payload = {
      playlist_id: pl.persistent_id,
    };
    return this.post(url, payload);
  }

  addToPlaylist(dst, tracks) {
    console.error('jooki add tracks: %o', { dst, tracks });
    throw new Error("not implemented");
    const url = '/api/jooki/copy';
    const payload = {
      jooki_playlist_id: dst.persistent_id,
      tracks: tracks,
    };
    const args = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    };
    return this.fetch(url, args)
      .then(pl => pl.track_ids);
  };

  reorderTracks(playlist, targetIndex, sourceIndices) {
    console.error('jooki reorder tracks: %o', { playlist, targetIndex, sourceIndices });
    const url = '/api/jooki/copy';
    const moveIdx = new Set(sourceIndices);
    const before = playlist.tracks.slice(0, targetIndex)
      .filter((tr, i) => !moveIdx.has(i));
    const after = playlist.tracks.filter((tr, i) => i >= targetIndex && !moveIdx.has(i));
    const moved = playlist.tracks.filter((tr, i) => moveIdx.has(i));
    const tracks = before.concat(moved).concat(after)
      .map(tr => ({ jooki_id: tr.persistent_id }));
    const payload = {
      jooki_playlist_id: playlist.persistent_id,
      tracks: tracks,
    };
    return this.post(url, payload);
    /*
    const target = playlist.tracks[targetIndex];
    const sources = sourceIndices.map(i => playlist.tracks[i]);
    const tracks = playlist.tracks.filter((t, i) => !sourceIndices.includes(i));
    const newIdx = tracks.findIndex(t => t === target);
    const before = newIdx === -1 ? [] : tracks.slice(0, newIdx+1);
    const after = newIdx === -1 ? tracks.slice(0) : tracks.slice(newIdx+1);
    const newTracks = before.concat(sources).concat(after);
    const url = `/api/playlist/${playlist.persistent_id}?replace=true`;
    const args = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newTracks.map(track => { return { persistent_id: track.persistent_id }; })),
    };
    return this.fetch(url, args)
      .then(pl => pl.track_ids);
    */
  }

  deletePlaylistTracks(playlist, selected) {
    console.error('jooki delete tracks: %o', { playlist, selected });
    const url = '/api/jooki/copy';
    const delIdx = new Set(selected.map(sel => sel.index));
    const tracks = playlist.tracks.filter((tr, i) => !delIdx.has(i))
      .map(tr => ({ jooki_id: tr.persistent_id }));
    const payload = {
      jooki_playlist_id: playlist.persistent_id,
      tracks: tracks,
    };
    return this.post(url, payload);
    /*
    const newTracks = playlist.tracks.filter(track => !selected[track.persistent_id]);
    const url = `/api/playlist/${playlist.persistent_id}?replace=true`;
    const args = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newTracks.map(track => { return { persistent_id: track.persistent_id }; })),
    };
    return this.fetch(url, args)
      .then(pl => pl.track_ids);
    */
  }

  loadGenres() {
    throw new Error("not implemented");
  }

  loadPlaylistTracks(playlist) {
    return this.loadState()
      .then(state => {
        if (state.db.playlists[playlist.persistent_id]) {
          return state.db.playlists[playlist.persistent_id].tracks.map(id => {
            return Object.assign({}, state.db.tracks[id], { persistent_id: id });
          });
        }
        return [];
      });
  }

  loadAlbumTracks(album) {
    throw new Error("not implemented");
  }

  loadArtists(genre) {
    throw new Error("not implemented");
  }

  loadAlbums(artist) {
    throw new Error("not implemented");
  }

  queueManip(method, tracks) {
    throw new Error("not implemented");
  }    

  setPlaylist(id, index) {
    const url = '/api/jooki/playlist/play';
    const payload = {
      jooki_playlist_id: id,
      index: (index || 0) + 1,
    };
    return this.post(url, payload);
  }

  play() {
    const url = '/api/jooki/play';
    return this.post(url);
  }

  pause() {
    const url = '/api/jooki/pause';
    return this.post(url);
  }

  skipTo(idx) {
    const url = '/api/jooki/skip';
    return this.post(url, idx + 1);
  }

  skipBy(n) {
    const url = '/api/jooki/skip';
    return this.put(url, n || 1);
  }

  seekTo(ms) {
    const url = '/api/jooki/seek';
    return this.post(url, Math.round(ms));
  }

  seekBy(ms) {
    const url = '/api/jooki/seek';
    return this.put(url, Math.round(ms));
  }

  getVolume() {
    const url = '/api/jooki/volume';
    return this.get(url);
  }

  setVolumeTo(vol) {
    const url = '/api/jooki/volume';
    return this.post(url, vol);
  }

  changeVolumeBy(delta) {
    const url = '/api/jooki/volume';
    return this.put(url, delta);
  }

  replaceQueue(tracks) {
    throw new Error("queue manipulation not available on jooki");
  }

  appendToQueue(tracks) {
    throw new Error("queue manipulation not available on jooki");
  }

  insertIntoQueue(tracks) {
    throw new Error("queue manipulation not available on jooki");
  }

  getPlayMode() {
    const url = '/api/jooki/playmode';
    return this.get(url);
  }

  setPlayMode(mode) {
    const url = '/api/jooki/playmode';
    return this.post(url, mode);
  }

}
