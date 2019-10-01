import React, { useRef, useEffect, useReducer, useMemo } from 'react';
import { WS } from './ws';
import { SonosAPI } from './sonos';

const initState = () => {
  return {
    queue: [],
    index: -1,
    playStatus: 'PAUSED',
    currentTime: 0,
    currentTimeSet: 0,
    currentTimeSetAt: 0,
    duration: 0,
    volume: 20,
  };
};

const reducer = (state, action) => {
  let update = {};
  switch (action.type) {
  case 'ws':
    if (action.message.queue) {
      if (action.message.queue.tracks) {
        update.queue = action.message.queue.tracks;
      }
      if (Object.hasOwnProperty.call(action.message.queue, 'index')) {
        update.index = action.message.queue.index;
        if (action.message.queue.tracks) {
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
    } else if (Object.hasOwnProperty.call(action.message, 'tracks')) {
      update.queue = action.message.tracks;
      if (Object.hasOwnProperty.call(action.message, 'index')) {
        update.index = action.message.index;
        update.duration = action.message.tracks[action.message.index].total_time;
        update.currentTime = action.message.time;
        update.currentTimeSet = action.message.time;
        update.currentTimeSetAt = Date.now();
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
    };
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
  }
  return state;
};

export const useSonosPlayer = (onLoginRequired) => {
  const api = useMemo(() => new SonosAPI(onLoginRequired), [onLoginRequired]);
  const timeKeeper = useRef(null);
  const [state, dispatch] = useReducer(reducer, null, initState);

  useEffect(() => {
    const wsHandler = msg => {
      if (msg.type === 'sonos') {
        dispatch({ type: 'ws', message: msg.event });
      }
    };
    api.getSonosQueue().then(queue => {
      dispatch({ action: 'refresh', update: queue });
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
