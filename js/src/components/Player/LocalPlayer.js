import React, { useReducer, useMemo, useRef, useEffect, useContext } from 'react';
import { LoginContext } from '../../lib/login';
import { API, REPEAT, SHUFFLE } from '../../lib/api';

const getTrackUrl = (track) => {
  if (!track) {
    return null;
  }
  let ext = '';
  if (track.location) {
    const m = track.location.match(/(\.[A-Za-z0-9]{,4})$/);
    if (m) {
      ext = m[1];
    }
  }
  if (ext === '') {
    if (track.kind === 'MPEG audio file') {
      ext = '.mp3';
    } else if (track.kind === 'Purchased AAC audio file') {
      ext = '.m4a';
    }
  }
  return `/api/track/${track.persistent_id}${ext}`;
};

const initState = () => {
  const saved = window.localStorage.getItem('localPlayerState');
  return Object.assign({
    player: 'local',
    queue: [],
    index: -1,
    playStatus: 'PAUSED',
    currentTime: 0,
    duration: 0,
    volume: 20,
    playMode: 0,
  }, (saved ? JSON.parse(saved) : {}));
};

const saveState = state => {
  const saved = JSON.stringify({
    queue: state.queue,
    index: state.index,
    volume: state.volume,
  });
  window.localStorage.setItem('localPlayerState', saved);
  return state;
};

const reducer = (state, action) => {
  let update = {};
  switch (action.type) {
  case 'play':
    return Object.assign({}, state, { playStatus: 'PLAYING' });
  case 'pause':
    return Object.assign({}, state, { playStatus: 'PAUSED' });
  case 'skipTo':
    if (action.index < 0) {
      update.index = -1;
      update.playStatus = 'PAUSED';
    } else if (action.index >= state.queue.length) {
      update.index = -1;
      update.playStatus = 'PAUSED';
    } else {
      update.index = action.index;
      update.playStatus = 'PLAYING';
    }
    return saveState(Object.assign({}, state, update));
  case 'skipBy':
    if (state.index + action.count < 0) {
      update.index = -1;
      update.playStatus = 'PAUSED';
    } else if (state.index + action.count >= state.queue.length) {
      update.index = -1;
      update.playStatus = 'PAUSED';
    } else {
      update.index = state.index + action.count;
      update.playStatus = 'PLAYING';
    }
    return saveState(Object.assign({}, state, update));
  case 'advance':
    if (state.index + 1 <= state.queue.length) {
      update.index = state.index + 1;
      update.playStatus = 'PLAYING';
    } else {
      update.index = -1;
      update.playStatus = 'PAUSED';
    }
    return saveState(Object.assign({}, state, update));
  case 'replace':
    update = {
      queue: action.tracks,
      index: action.tracks.length > 0 ? 0 : -1,
      playStatus: 'PLAYING',
    };
    return saveState(Object.assign({}, state, update));
  case 'append':
    update = {
      queue: state.queue.concat(action.tracks),
    };
    return saveState(Object.assign({}, state, update));
  case 'insert':
    const before = state.queue.slice(0, state.index + 1);
    const after = state.queue.slice(state.index + 1);
    update = {
      queue: before.concat(action.tracks).concat(after),
    };
    return saveState(Object.assign({}, state, update));
  case 'playlist':
    update = {
      queue: action.tracks,
      index: action.index || 0,
      playStatus: 'PLAYING',
    };
    return saveState(Object.assign({}, state, update));
  case 'volumeTo':
    update = { volume: Math.min(100, Math.max(0, action.volume)) };
    return saveState(Object.assign({}, state, update));
  case 'volumeBy':
    update = {
      volume: Math.min(100, Math.max(0, state.volume + action.delta)),
    };
    return saveState(Object.assign({}, state, update));
  case 'time':
    update = {
      currentTime: action.current,
      duration: action.duration,
    };
    return Object.assign({}, state, update);
  case 'shuffle':
    update = { playMode: state.playMode ^ SHUFFLE };
    return saveState(Object.assign({}, state, update));
  case 'repeat':
    update = { playMode: state.playMode ^ REPEAT };
    return saveState(Object.assign({}, state, update));
  }
  return state;
};

export const LocalPlayer = ({
  setPlaybackInfo,
  setControlAPI,
}) => {
  const { onLoginRequired } = useContext(LoginContext);
  const players = useRef([null, null]);
  const [state, dispatch] = useReducer(reducer, null, initState);
  const index = useRef(state.index);
  const api = useMemo(() => new API(onLoginRequired), [onLoginRequired]);
  useEffect(() => {
    index.current = state.index;
  }, [state.index]);
  const controlAPI = useMemo(() => {
    const onPlay = () => {
      dispatch({ type: 'play' });
      return Promise.resolve();
    };
    const onPause = () => {
      dispatch({ type: 'pause' });
      return Promise.resolve();
    };
    const onSkipTo = (idx) => {
      players.current.filter(player => !!player).forEach(player => player.pause());
      dispatch({ type: 'skipTo', index: idx });
      return Promise.resolve();
    };
    const onSkipBy = (cnt) => {
      players.current.filter(player => !!player).forEach(player => player.pause());
      dispatch({ type: 'skipBy', count: cnt });
      return Promise.resolve();
    };
    const onSeekTo = (abs) => {
      const player = players.current[index.current % 2];
      if (!player) {
        return;
      }
      if (abs < 0) {
        player.currentTime = 0;
      } else if (abs / 1000.0 >= player.duration) {
        return onSkipBy(1);
      } else {
        player.currentTime = abs / 1000.0;
      }
      return Promise.resolve();
    };
    const onSeekBy = (del) => {
      const player = players.current[index.current % 2];
      if (!player) {
        return;
      }
      const abs = player.currentTime + del;
      if (abs < 0) {
        player.currentTime = 0;
      } else if (abs / 1000.0 >= player.duration) {
        return onSkipBy(1);
      } else {
        player.currentTime = abs / 1000.0;
      }
      return Promise.resolve();
    };
    const onReplaceQueue = (tracks) => {
      dispatch({ type: 'replace', tracks });
      return Promise.resolve();
    };
    const onAppendToQueue = (tracks) => {
      dispatch({ type: 'append', tracks });
      return Promise.resolve();
    };
    const onInsertIntoQueue = (tracks) => {
      dispatch({ type: 'insert', tracks });
      return Promise.resolve();
    };
    const onSetPlaylist = (id, idx) => {
      return api.loadPlaylist(id)
        .then(pl => dispatch({ type: 'playlist', tracks: pl.items, index: idx }));
    };
    const onSetVolumeTo = (vol) => {
      dispatch({ type: 'volumeTo', volume: vol });
      return Promise.resolve();
    };
    const onChangeVolumeBy = (del) => {
      dispatch({ type: 'volumeBy', delta: del });
      return Promise.resolve();
    };
    const onShuffle = () => {
      dispatch({ type: 'shuffle' });
      return Promise.resolve();
    };
    const onRepeat = () => {
      dispatch({ type: 'repeat' });
      return Promise.resolve();
    };
    return {
      onPlay,
      onPause,
      onSkipTo,
      onSkipBy,
      onSeekTo,
      onSeekBy,
      onReplaceQueue,
      onAppendToQueue,
      onInsertIntoQueue,
      onSetPlaylist,
      onSetVolumeTo,
      onChangeVolumeBy,
      onShuffle,
      onRepeat,
    };
  }, [api]);

  useEffect(() => setControlAPI(controlAPI), [controlAPI]);
  useEffect(() => setPlaybackInfo(state), [state]);

  useEffect(() => {
    players.current.filter(player => !!player).forEach(player => player.currentTime = 0);
  }, [state.index]);

  useEffect(() => {
    const player = players.current[state.index % 2];
    if (player) {
      if (state.playStatus === 'PLAYING' && player.paused) {
        player.play();
      } else if (state.playStatus !== 'PLAYING' && !player.paused) {
        player.pause();
      }
    }
  }, [state.playStatus, state.index]);

  const trackUrl = useMemo(() => {
    const curUrl = getTrackUrl(state.queue[state.index]);
    const nxtUrl = getTrackUrl(state.queue[state.index + 1]);
    return state.index % 2 === 0 ? [curUrl, nxtUrl] : [nxtUrl, curUrl];
  }, [state.queue, state.index]);

  const onCanPlay = useMemo(() => {
    return evt => {
      if (state.playStatus === 'PLAYING') {
        if (evt.target === players.current[state.index % 2]) {
          evt.target.play();
        }
      }
    };
  }, [state.index, state.playStatus]);

  const onTimeUpdate = useMemo(() => {
    return (evt, n) => {
      if (n === state.index % 2) {
        dispatch({
          type: 'time',
          current: Math.round(1000 * evt.target.currentTime),
          duration: Math.round(1000 * evt.target.duration),
        });
      }
    };
  }, [state.index]);

  const onEnded = useMemo(() => {
    return evt => {
      if (state.playStatus === 'PLAYING') {
        const player = players.current[(state.index + 1) % 2];
        if (player && player.src) {
          player.play();
        }
      }
      evt.target.pause();
      dispatch({ type: 'advance' });
    };
  }, [state.index, state.playStatus]);

  return (
    <div id="localplayer">
      <audio
        key="player0"
        id="player0"
        ref={node => {
          if (node) {
            players.current[0] = node;
          }
        }}
        src={trackUrl[0]}
        preload="auto"
        volume={state.volume / 100.0}
        onCanPlay={onCanPlay}
        onDurationChange={evt => onTimeUpdate(evt, 0)}
        onEnded={onEnded}
        onPlaying={evt => onTimeUpdate(evt, 0)}
        onTimeUpdate={evt => onTimeUpdate(evt, 0)}
      />
      <audio
        key="player1"
        id="player1"
        ref={node => {
          if (node) {
            players.current[1] = node;
          }
        }}
        preload="auto"
        src={trackUrl[1]}
        volume={state.volume / 100.0}
        onCanPlay={onCanPlay}
        onDurationChange={evt => onTimeUpdate(evt, 1)}
        onEnded={onEnded}
        onPlaying={evt => onTimeUpdate(evt, 1)}
        onTimeUpdate={evt => onTimeUpdate(evt, 1)}
      />
    </div>
  );
};

