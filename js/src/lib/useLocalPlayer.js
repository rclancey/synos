import React, { useMemo, useRef, useEffect, useReducer } from 'react';
import { API } from './api';

const trackUrl = (track) => {
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

const playerTrack = node => {
  if (!node || !node.src) {
    return null;
  }
  return new URL(node.src).pathname;
};

const initState = () => {
  const saved = window.localStorage.getItem('localPlayerState');
  return Object.assign({
    queue: [],
    index: -1,
    playStatus: 'PAUSED',
    currentTime: 0,
    duration: 0,
    volume: 20,
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
      queue: state.queue.tracks.concat(action.tracks),
    };
    return saveState(Object.assign({}, state, update));
  case 'insert':
    const before = state.queue.tracks.slice(0, state.index + 1);
    const after = state.queue.tracks.slice(state.index + 1);
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
  }
  return state;
};

export const useLocalPlayer = (onLoginRequired) => {
  const api = useMemo(() => new API(onLoginRequired), [onLoginRequired]);
  const player = useRef([null, null]);
  const playerNode = useRef([null, null]);
  const curRef = useRef(null);
  const nextRef = useRef(null);
  const statusRef = useRef(null);

  const onPlay = useRef(null);
  const onPause = useRef(null);
  const onSkipTo = useRef(null);
  const onSkipBy = useRef(null);
  const onSeekTo = useRef(null);
  const onSeekBy = useRef(null);
  const onReplaceQueue = useRef(null);
  const onAppendToQueue = useRef(null);
  const onInsertIntoQueue = useRef(null);
  const onSetPlaylist = useRef(null);
  const onSetVolumeTo = useRef(null);
  const onChangeVolumeBy = useRef(null);

  const [state, dispatch] = useReducer(reducer, null, initState);

  const currentPlayer = playerNode.current[state.index % 2];
  const nextPlayer = playerNode.current[(state.index + 1) % 2];

  useEffect(() => {
    statusRef.current = state.playStatus;
  }, [state.playStatus]);
  useEffect(() => {
    if (currentPlayer) {
      const currentTrack = trackUrl(state.queue[state.index]);
      if (currentTrack !== playerTrack(currentPlayer)) {
        if (!currentPlayer.paused) {
          currentPlayer.pause();
        }
        if (currentTrack) {
          currentPlayer.src = currentTrack;
        }
      }
    }
    if (nextPlayer) {
      const nextTrack = trackUrl(state.queue[state.index + 1]);
      if (nextTrack !== playerTrack(nextPlayer)) {
        if (!nextPlayer.paused) {
          nextPlayer.pause();
        }
        if (nextTrack) {
          nextPlayer.src = nextTrack;
        }
      }
    }
  }, [state.queue, state.index]);
  useEffect(() => {
    nextRef.current = nextPlayer;
    if (nextPlayer && !nextPlayer.paused) {
      nextPlayer.pause();
    }
  }, [nextPlayer]);

  useEffect(() => {
    curRef.current = currentPlayer;
    if (currentPlayer) {
      if (state.playStatus === 'PLAYING') {
        if (currentPlayer.paused) {
          currentPlayer.play();
        }
      } else {
        if (!currentPlayer.paused) {
          currentPlayer.pause();
        }
      }
    }
  }, [state.playStatus, currentPlayer]);

  useEffect(() => {
    [0, 1].forEach(i => {
      if (playerNode.current[i]) {
        playerNode.current[i].volume = state.volume / 100.0;
      }
    });
  }, [state.volume]);

  useEffect(() => {
    onPlay.current = () => dispatch({ type: 'play' });
    onPause.current = () => dispatch({ type: 'pause' });
    onSkipTo.current = idx => dispatch({ type: 'skipTo', index: idx });
    onSkipBy.current = cnt => dispatch({ type: 'skipBy', count: cnt });
    onReplaceQueue.current = tracks => dispatch({ type: 'replace', tracks });
    onAppendToQueue.current = tracks => dispatch({ type: 'append', tracks });
    onInsertIntoQueue.current = tracks => dispatch({ type: 'insert', tracks });
    onSetPlaylist.current = (id, index) => {
      api.loadPlaylist(id)
        .then(pl =>  {
          dispatch({ type: 'playlist', tracks: pl.items, index: index });
        });
    };
    onSetVolumeTo.current = vol => dispatch({ type: 'volumeTo', volume: vol });
    onChangeVolumeBy.current = delta => dispatch({ type: 'volumeBy', delta: delta });

    onSeekTo.current = ms => {
      const player = curRef.current;
      if (!player) {
        return;
      }
      if (ms < 0) {
        player.currentTime = 0;
      } else if (ms / 1000.0 >= player.duration) {
        onSkipBy.current(1);
      } else {
        player.currentTime = ms / 1000.0;
      }
    };
    onSeekBy.current = ms => {
      const player = curRef.current;
      if (!player) {
        return;
      }
      const abs = player.currentTime + ms;
      if (abs < 0) {
        player.currentTime = 0;
      } else if (abs / 1000.0 >= player.duration) {
        onSkipBy.current(1);
      } else {
        player.currentTime = abs / 1000.0;
      }
    };

    const onCanPlay = evt => {
      if (statusRef.current === 'PLAYING') {
        if (evt.target === curRef.current) {
          evt.target.play();
        }
      }
    };
    const onEnded = evt => {
      if (statusRef.current === 'PLAYING') {
        if (nextRef.current && nextRef.current.src) {
          nextRef.current.play();
        }
        dispatch({ type: 'advance' });
      }
    };
    const onTimeUpdate = evt => {
      if (evt.target === curRef.current) {
        console.debug('time update: %o', evt.target.currentTime);
        dispatch({
          type: 'time',
          current: Math.round(1000 * evt.target.currentTime),
          duration: Math.round(1000 * evt.target.duration),
        });
      } else {
        console.debug('time update on wrong node: %o !== %o', evt.target, curRef.current)
      }
    };

    player.current[0] = (
      <audio
        key="player0"
        id="player0"
        ref={node => {
          if (node) {
            playerNode.current[0] = node;
          }
        }}
        volume={state.volume / 100.0}
        onCanPlay={onCanPlay}
        onDurationChange={onTimeUpdate}
        onEnded={onEnded}
        onPlaying={onTimeUpdate}
        onTimeUpdate={onTimeUpdate}
      />
    );
    player.current[1] = (
      <audio
        key="player1"
        id="player1"
        ref={node => {
          if (node) {
            playerNode.current[1] = node;
          }
        }}
        volume={state.volume / 100.0}
        onCanPlay={onCanPlay}
        onDurationChange={onTimeUpdate}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
      />
    );
    return () => {
      [0, 1].forEach(i => {
        if (playerNode.current[i]) {
          playerNode.current[i].pause();
          playerNode.current[i] = null;
        }
        player.current[i] = null;
        curRef.current = null;
        nextRef.current = null;
      });
    };
  }, []);

  return {
    players: player.current,
    queue: state.queue,
    index: state.index,
    playStatus: state.playStatus,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    track: state.queue[state.index],
    onPlay: onPlay.current,
    onPause: onPause.current,
    onSkipTo: onSkipTo.current,
    onSkipBy: onSkipBy.current,
    onSeekTo: onSeekTo.current,
    onSeekBy: onSeekBy.current,
    onReplaceQueue: onReplaceQueue.current,
    onAppendToQueue: onAppendToQueue.current,
    onInsertIntoQueue: onInsertIntoQueue.current,
    onSetPlaylist: onSetPlaylist.current,
    onSetVolumeTo: onSetVolumeTo.current,
    onChangeVolumeBy: onChangeVolumeBy.current,
  };
};
