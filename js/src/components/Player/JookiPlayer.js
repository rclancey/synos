import React, { useReducer, useMemo, useRef, useEffect, useContext } from 'react';
import LoginContext from '../../context/LoginContext';
import { WS } from '../../lib/ws';
import { SHUFFLE, REPEAT } from '../../lib/api';
import { useJooki } from '../../lib/jooki';

const initState = () => {
  return {
    player: 'jooki',
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

const jookiPlToQueue = (pl, lib) => {
  if (!pl || !pl.tracks || !lib || !lib.tracks) {
    return [];
  }
  return pl.tracks.map(id => {
    const tr = lib.tracks[id];
    return Object.assign({}, tr, { jooki_id: id, name: tr.title });
  });
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
          out.index = delta.audio.nowPlaying.trackIndex - 1;
          out.duration = Math.round(delta.audio.nowPlaying.duration_ms);
        }
        if (delta.audio.playback) {
          out.currentTime = Math.round(delta.audio.playback.position_ms);
          out.currentTimeSet = out.currentTime;
          out.currentTimeSetAt = Date.now();
          out.playStatus = delta.audio.playback.state;
        }
        if (delta.audio.config) {
          out.playMode = 0;
          if (delta.audio.config.repeat_mode !== 0) {
            out.playMode |= REPEAT;
          }
          if (delta.audio.config.shuffle_mode) {
            out.playMode |= SHUFFLE;
          }
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
      out.queue = jookiPlToQueue(pl, out);
    }
    console.debug('jooki update state: %o => %o', msg, out);
    return out;
  case 'refresh':
    out = initState();
    if (!action.state) {
      return out;
    }
    if (action.state.audio) {
      if (action.state.audio.config) {
        out.volume = action.state.audio.config.volume;
      }
      if (action.state.audio.nowPlaying) {
        out.playlistId = action.state.audio.nowPlaying.playlistId;
        out.index = action.state.audio.nowPlaying.trackIndex - 1;
        out.duration = Math.round(action.state.audio.nowPlaying.duration_ms);
      }
      if (action.state.audio.playback) {
        out.currentTime = Math.round(action.state.audio.playback.position_ms);
        out.currentTimeSet = out.currentTime;
        out.currentTimeSetAt = Date.now();
        out.playStatus = action.state.audio.playback.state;
      }
      if (action.state.audio.config) {
        out.playMode = 0;
        if (action.state.audio.config.repeat_mode !== 0) {
          out.playMode |= REPEAT;
        }
        if (action.state.audio.config.shuffle_mode) {
          out.playMode |= SHUFFLE;
        }
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
      out.queue = jookiPlToQueue(pl, out);
    }
    console.debug('jooki refresh state: %o => %o', action, out);
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
  default:
    console.error("unhandled action: %o", action);
  }
  return state;
};

export const JookiPlayer = ({
  setTiming,
  setPlaybackInfo,
  setControlAPI,
}) => {
  //const { onLoginRequired } = useContext(LoginContext);
  const [state, dispatch] = useReducer(reducer, null, initState);
  const { api, manager } = useJooki();
  //const api = useMemo(() => new JookiAPI(onLoginRequired), [onLoginRequired]);
  const timeKeeper = useRef(null);

  useEffect(() => {
    const off = manager.handle((msg) => {
      if (msg.type === 'jooki') {
        dispatch({ type: 'ws', deltas: msg.deltas });
      }
    });
    dispatch({ type: 'refresh', state: manager.state.state });
    timeKeeper.current = setInterval(() => dispatch({ type: 'tick' }), 250);
    return () => {
      clearInterval(timeKeeper.current);
      off();
    };
  }, [api]);

  const controlAPI = useMemo(() => {
    return {
      onPlay: () => api.play(),
      onPause: () => api.pause(),
      onSkipTo: (idx) => api.skipTo(idx + 1),
      onSkipBy: (cnt) => api.skipBy(cnt),
      onSeekTo: (abs) => api.seekTo(abs),
      onSeekBy: (del) => api.seekBy(del),
      onReplaceQueue: null, //(tracks) => api.replaceQueue(tracks),
      onAppendToQueue: null, //(tracks) => api.appendToQueue(tracks),
      onInsertIntoQueue: null, //(tracks) => api.insertIntoQueue(tracks),
      onSetPlaylist: (id, idx) => api.setPlaylist(id, idx),
      onSetVolumeTo: (vol) => api.setVolumeTo(vol),
      onChangeVolumeBy: (del) => api.changeVolumeBy(del),
      onShuffle: () => api.getPlayMode()
        .then(mode => api.setPlayMode(mode ^ SHUFFLE)),
      onRepeat: () => api.getPlayMode()
        .then(mode => api.setPlayMode(mode ^ REPEAT)),
    };
  }, [api]);

  useEffect(() => { console.debug('setting control api to jooki: %o', controlAPI); setControlAPI(controlAPI); }, [controlAPI, setControlAPI]);
  useEffect(() => {
    setTiming({
      currentTime: state.currentTime,
      duration: state.duration,
    });
  }, [state.currentTime, state.duration, setTiming]);
  useEffect(() => {
    setPlaybackInfo({
      player: 'jooki',
      playlistId: state.playlistId,
      queue: state.queue,
      index: state.index,
      playStatus: state.playStatus,
      volume: state.volume,
      playMode: state.playMode,
    });
  }, [state.playlistId, state.queue, state.index, state.playStatus, state.volume, state.playMode, setPlaybackInfo]);

  return (
    <div id="jookiPlayer" />
  );
};
