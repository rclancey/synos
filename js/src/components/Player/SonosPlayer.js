import React, { useReducer, useMemo, useRef, useEffect, useContext } from 'react';
import LoginContext from '../../context/LoginContext';
import { WS } from '../../lib/ws';
import { SHUFFLE, REPEAT } from '../../lib/api';
import { SonosAPI } from '../../lib/sonos';

const initState = () => {
  return {
    player: 'sonos',
    queue: [],
    index: -1,
    playStatus: 'PAUSED',
    currentTime: 0,
    currentTimeSet: 0,
    currentTimeSetAt: 0,
    duration: 0,
    volume: 20,
    playMode: 0,
  };
};
const reducer = (state, action) => {
  let update = {};
  switch (action.type) {
  case 'ws':
    if (!action.message) {
      return state;
    }
    if (action.message.queue) {
      if (action.message.queue.tracks) {
        update.queue = action.message.queue.tracks;
      }
      if (Object.hasOwnProperty.call(action.message.queue, 'index')) {
        update.index = action.message.queue.index;
        if (action.message.queue.tracks && action.message.queue.tracks[action.message.queue.index]) {
          update.duration = action.message.queue.tracks[action.message.queue.index].total_time;
        }
        update.currentTime = action.message.queue.time;
        update.currentTimeSet = action.message.queue.time;
        update.currentTimeSetAt = Date.now();
      }
      update.playStatus = action.message.state;
    } else if (Object.hasOwnProperty.call(action.message, 'queue_position')) {
      if (action.message.queue_position !== state.index) {
        update.index = action.message.queue_position
        update.duration = action.message.current_track.total_time;
        update.currentTime = 0;
        update.currentTimeSet = 0;
        update.currentTimeSetAt = Date.now();
      }
      update.playStatus = action.message.state;
      update.playMode = action.message.mode;
    } else if (Object.hasOwnProperty.call(action.message, 'tracks')) {
      update.queue = action.message.tracks;
      if (Object.hasOwnProperty.call(action.message, 'index')) {
        if (action.message.index >= 0) {
          update.index = action.message.index;
          update.duration = action.message.tracks[action.message.index].total_time;
          update.currentTime = action.message.time;
          update.currentTimeSet = action.message.time;
          update.currentTimeSetAt = Date.now();
        }
      }
    } else if (Object.hasOwnProperty.call(action.message, 'volume')) {
      update.volume = action.message.volume;
    }
    if (Object.keys(update).length > 0) {
      return Object.assign({}, state, update);
    }
    return state;
  case 'refresh':
    update = {
      playStatus: action.update.state,
      queue: action.update.tracks,
      index: action.update.index,
      duration: action.update.duration,
      currentTime: action.update.time,
      currentTimeSet: action.update.time,
      currentTimeSetAt: Date.now(),
      volume: action.update.volume,
      playMode: action.update.mode,
    };
    //console.debug('sonos refresh: %o', update);
    return Object.assign({}, state, update);
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
    console.error("unhandled action %o", action);
  }
  return state;
};

export const SonosPlayer = ({
  setTiming,
  setPlaybackInfo,
  setControlAPI,
}) => {
  const { onLoginRequired } = useContext(LoginContext);
  const [state, dispatch] = useReducer(reducer, null, initState);
  const api = useMemo(() => new SonosAPI(onLoginRequired), [onLoginRequired]);
  const timeKeeper = useRef(null);

  useEffect(() => {
    const wsHandler = msg => {
      if (msg.type === 'sonos') {
        dispatch({ type: 'ws', message: msg.event });
      }
    };
    api.getQueue().then(queue => {
      //console.debug('sonos queue: %o', queue);
      dispatch({ type: 'refresh', update: queue });
      WS.on('message', wsHandler);
    });
    timeKeeper.current = setInterval(() => dispatch({ type: 'tick' }), 250);
    const onWake = (evt) => {
      if (document.visibilityState === 'visible') {
        api.getQueue().then(queue => {
          dispatch({ type: 'refresh', update: queue });
        });
      }
    };
    document.addEventListener('visibilitychange', onWake);
    return () => {
      clearInterval(timeKeeper.current);
      WS.off('message', wsHandler);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [api]);
  const controlAPI = useMemo(() => {
    return {
      onPlay: () => api.play(),
      onPause: () => api.pause(),
      onSkipTo: (idx) => api.skipTo(idx),
      onSkipBy: (cnt) => api.skipBy(cnt),
      onSeekTo: (abs) => api.seekTo(abs),
      onSeekBy: (del) => api.seekBy(del),
      onReplaceQueue: (tracks) => api.replaceQueue(tracks),
      onAppendToQueue: (tracks) => api.appendToQueue(tracks),
      onInsertIntoQueue: (tracks) => api.insertIntoQueue(tracks),
      onSetPlaylist: (id, idx) => api.setPlaylist(id, idx),
      onSetVolumeTo: (vol) => api.setVolumeTo(vol),
      onChangeVolumeBy: (del) => api.changeVolumeBy(del),
      onShuffle: () => api.getPlayMode()
        .then(mode => api.setPlayMode(mode ^ SHUFFLE)),
      onRepeat: () => api.getPlayMode()
        .then(mode => api.setPlayMode(mode ^ REPEAT)),
    };
  }, [api]);

  useEffect(() => setControlAPI(controlAPI), [controlAPI, setControlAPI]);
  useEffect(() => {
    setTiming({
      currentTime: state.currentTime,
      duration: state.duration,
    });
  }, [state.currentTime, state.duration, setTiming]);
  useEffect(() => {
    setPlaybackInfo({
      player: 'sonos',
      playlistId: null,
      queue: state.queue,
      queueOrder: state.queueOrder,
      index: state.index,
      playStatus: state.playStatus,
      volume: state.volume,
      playMode: state.playMode,
    });
  }, [state.queue, state.queueOrder, state.index, state.playStatus, state.volume, state.playMode, setPlaybackInfo]);

  return (
    <div id="sonosPlayer" />
  );
};
