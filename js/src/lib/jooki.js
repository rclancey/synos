import { useEffect, useMemo, useState } from 'react';
import { APIBase } from './api';
import { WS } from './ws';
import { useAPI } from './useAPI';

class JookiStateManagerCls {
  constructor() {
    this.listeners = [];
    this.handlers = [];
    this.state = {};
    this.api = null;
    const msgHandler = (msg) => {
      if (msg.type === 'jooki') {
        this.setState((orig) => {
          const out = { ...orig };
          out.state = out.state ? { ...out.state } : {};
          msg.deltas.forEach((delta) => {
            Object.entries(delta).forEach(([key, value]) => {
              if (value !== null) {
                out.state = { ...out.state, [key]: value };
              }
            });
          });
          return out;
        });
        this.handlers.forEach((h) => h(msg));
      }
    };
    WS.on('message', msgHandler);
  }

  setState(arg) {
    if (typeof arg === 'function') {
      this.state = arg(this.state);
    } else {
      this.state = arg;
    }
    this.listeners.forEach((l) => l(this.state));
  }

  handle(handler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  listen(listener) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  setApi(api) {
    if (api !== null && api !== undefined) {
      if (api !== this.api) {
        this.api = api;
        console.debug('jooki api changed');
        Promise.all([
          api.loadState(),
          api.loadPlaylists(),
        ]).then(([state, playlists]) => {
          this.setState({ api, state, playlists });
        });
      }
    }
  }
};

export const JookiStateManager = new JookiStateManagerCls();

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
  }

  loadPlaylists() {
    //console.error(new Error('loading playlists'));
    const url = '/api/jooki/playlists';
    return this.get(url);
  }

  loadPlaylist(playlistId) {
    const url = `/api/jooki/playlist/${playlistId}`;
    return this.get(url);
  }

  loadPlaylistTrackIds(pl) {
    return this.loadState()
      .then(state => {
        if (state.db.playlists[pl.persistent_id]) {
          return state.db.playlists[pl.persistent_id].tracks;
        }
        return [];
      });
  }

  /*
  copyPlaylist(pl) {
    const url = '/api/jooki/copy';
    const payload = {
      playlist_id: pl.persistent_id,
    };
    return this.post(url, payload);
  }
  */

  addToPlaylist(dst, tracks) {
    const url = `/api/jooki/playlist/${dst.persistent_id}`;
    return this.patch(url, tracks)
  }

  reorderTracks(playlist, targetIndex, sourceIndices) {
    const url = `/api/jooki/playlist/${playlist.persistent_id}`;
    const moveIdx = new Set(sourceIndices);
    const before = playlist.tracks.slice(0, targetIndex)
      .filter((tr, i) => !moveIdx.has(i));
    const after = playlist.tracks.filter((tr, i) => i >= targetIndex && !moveIdx.has(i));
    const moved = playlist.tracks.filter((tr, i) => moveIdx.has(i));
    const tracks = before.concat(moved).concat(after)
      .map(tr => ({ jooki_id: tr.jooki_id }));
    const payload = Object.assign({}, playlist, { tracks });
    return this.put(url, payload);
  }

  deletePlaylistTracks(playlist, selected) {
    console.debug('delete %o from %o', selected, playlist);
    const url = `/api/jooki/playlist/${playlist.persistent_id}`;
    const delIdx = new Set(selected.map(sel => sel.track.origIndex));
    const tracks = playlist.tracks.filter((tr, i) => !delIdx.has(i))
      .map(tr => ({ jooki_id: tr.jooki_id }));
    const payload = Object.assign({}, playlist, { tracks });
    return this.put(url, payload);
  }

  deletePlaylist(id) {
    const url = `/api/jooki/playlist/${id}`;
    return this.fetch(url, { method: 'DELETE' });
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
    const url = `/api/jooki/play/${id}/${index || 0}`;
    return this.post(url);
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
    return this.post(url, idx);
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

export const useJooki = () => {
  const api = useAPI(JookiAPI);
  const [state, setState] = useState(JookiStateManager.state);
  useEffect(() => {
    return JookiStateManager.listen(setState);
  }, []);
  useEffect(() => JookiStateManager.setApi(api), [api]);
  const obj = useMemo(() => ({ ...state, manager: JookiStateManager }), [state]);
  return obj;
};
