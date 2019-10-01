import React, { useRef, useEffect, useReducer, useMemo } from 'react';
import { WS } from './ws';
import { JookiAPI } from './jooki';

const deepUpdate = (prev, patch) => {
  if (patch === null) {
    return prev;
  }
  if (typeof patch === 'boolean') {
    return patch;
  }
  if (typeof patch === 'number') {
    return patch;
  }
  if (typeof patch === 'string') {
    return patch;
  }
  if (Array.isArray(patch)) {
    return patch;
  }
  if (Object.keys(patch).length === 0) {
    return prev;
  }
  const out = (!!prev && typeof prev === 'object') ? Object.assign({}, prev) : {};
  Object.entries(patch).forEach(([key, val]) => {
    out[key] = deepUpdate(out[key], val);
  });
  return out;
};

const initState = () => {
  return {
    playlistId: null,
    queue: [],
    index: -1,
    playStatus: 'PAUSED',
    currentTime: 0,
    currentTimeSet: 0,
    currentTimeSetAt: 0,
    duration: 0,
    volume: 20,
    playlists: {},
    tracks: {},
  };
};

const reducer = (state, action) => {
  let out = state;
  switch (action.type) {
  case 'ws':
    out = Object.assign({}, state);
    let queueNeedsUpdate = false;
    action.deltas.forEach(delta => {
      if (delta.audio) {
        if (delta.audio.config) {
          out.volume = delta.audio.config.volume;
        }
        if (delta.audio.nowPlaying) {
          if (delta.audio.nowPlaying.playlistId !== state.playlistId) {
            out.playlistId = delta.audio.nowPlaying.playlistId;
            queueNeedsUpdate = true;
          }
          out.index = delta.audio.nowPlaying.trackIndex;
          out.duration = Math.round(delta.audio.nowPlaying.duration_ms);
        }
        if (delta.audio.playback) {
          out.currentTime = Math.round(delta.audio.playback.position_ms);
          out.currentTimeSet = out.currentTime;
          out.currentTimeSetAt = Date.now();
          out.playStatus = delta.audio.playback.state;
        }
      }
      if (delta.db) {
        if (delta.db.playlists) {
          Object.entries(delta.db.playlists).forEach(([id, pl]) => {
            if (id === out.playlistId) {
              queueNeedsUpdate = true;
            }
            const plup = { [id]: pl };
            out.playlists = Object.assign({}, out.playlists, plup);
          });
        }
        if (delta.db.tracks) {
          Object.entries(delta.db.tracks).forEach(([id, tr]) => {
            const trup = { [id]: tr };
            out.tracks = Object.assign({}, out.tracks, trup);
          });
        }
      }
    });
    if (queueNeedsUpdate) {
      const pl = out.playlists[out.playlistId];
      out.queue = pl.tracks.map(id => Object.assign({}, out.tracks[id], { jooki_id: id }));
    }
    return out;
  case 'refresh':
    out = initState();
    if (action.state.audio) {
      if (action.state.audio.config) {
        out.volume = action.state.audio.config.volume;
      }
      if (action.state.audio.nowPlaying) {
        out.playlistId = action.state.audio.nowPlaying.playlistId;
        out.index = action.state.audio.nowPlaying.trackIndex;
        out.duration = Math.round(action.state.audio.nowPlaying.duration_ms);
      }
      if (action.state.audio.playback) {
        out.currentTime = Math.round(action.state.audio.playback.position_ms);
        out.currentTimeSet = out.currentTime;
        out.currentTimeSetAt = Date.now();
        out.playStatus = action.state.audio.playback.state;
      }
    }
    if (action.state.db) {
      if (action.state.db.playlists) {
        out.playlists = action.state.db.playlists;
      }
      if (action.state.db.tracks) {
        out.tracks = action.state.db.tracks;
      }
    }
    const pl = out.playlists[out.playlistId];
    if (pl) {
      out.queue = pl.tracks.map(id => Object.assign({}, out.tracks[id], { jooki_id: id }));
    }
    return out;
  case 'tick':
    if (state.playStatus !== 'PLAYING') {
      return state;
    }
    const currentTime = Math.min(
      state.duration,
      Math.max(0, state.currentTimeSet + Date.now() - state.currentTimeSetAt)
    );
    return Object.assign({}, state, { currentTime });
  }
  return state;
};

export const useJookiPlayer = (onLoginRequired) => {
  const api = useMemo(() => new JookiAPI(onLoginRequired), [onLoginRequired]);
  const timeKeeper = useRef(null);
  const [state, dispatch] = useReducer(reducer, null, initState);

  useEffect(() => {
    const wsHandler = msg => {
      if (msg.type === 'jooki') {
        dispatch({ type: 'ws', deltas: msg.deltas });
      }
    };
    api.loadState().then(jstate => {
      dispatch({ action: 'refresh', state: jstate });
      WS.on('message', wsHandler);
    });
    timeKeeper.current = setInterval(() => dispatch({ type: 'tick' }), 250);
    return () => {
      clearInterval(timeKeeper.current);
      WS.off('message', wsHandler);
    };
  }, []);

  return {
    queue: state.queue,
    index: state.index,
    playStatus: state.playStatus,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    track: state.queue[state.index],
    onPlay: api.play,
    onPause: api.pause,
    onSkipTo: api.skipTo,
    onSkipBy: api.skipBy,
    onSeekTo: api.seekTo,
    onSeekBy: api.seekBy,
    onReplaceQueue: api.replaceQueue,
    onAppendToQueue: api.appendToQueue,
    onInsertIntoQueue: api.insertIntoQueue,
    onSetPlaylist: api.setPlaylist,
    onSetVolumeTo: api.setVolumeTo,
    onChangeVolumeBy: api.changeVolumeBy,
  };
};

