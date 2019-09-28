import React, { useState, useMemo } from 'react';
import { TrackBrowser } from '../../Tracks/TrackBrowser.js';
import * as COLUMNS from '../../../../lib/columns';
import { jookiTokenImgUrl } from './Token';
import { JookiPlayer } from '../../../Player/JookiPlayer';
import { JookiControls } from './Controls';

const JookiPlaylistHeader = ({
  playlist,
  playbackInfo,
  controlAPI,
}) => {
  const durm = playlist.tracks.reduce((acc, tr) => acc + tr.total_time, 0) / 60000;
  const sizem = playlist.tracks.reduce((acc, tr) => acc + tr.size, 0) / (1024 * 1024);
  let dur = '';
  if (durm > 36 * 60) {
    const days = Math.floor(durm / (24 * 60));
    const hours = Math.round((durm % (24 * 60)) / 60);
    dur = `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (durm > 60) {
    const hours = Math.floor(durm / 60);
    const mins = Math.round(durm % 60);
    dur = `${hours}:${mins < 10 ? '0' + mins : mins}`;
  } else {
    const mins = Math.round(durm * 10) / 10;
    dur = `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  let size = '';
  if (sizem >= 10240) {
    size = `${Math.round(sizem / 1024)} GB`;
  } else if (sizem > 1024) {
    size = `${Math.round(sizem / 102.4) * 10} GB`;
  } else {
    size = `${Math.round(sizem)} MB`;
  }
  console.debug('header: %o', { playlist, durm, sizem, dur, size });
  window.jookiControlAPI = controlAPI;
  window.jookiPlayback = playbackInfo;
  return (
    <div style={{display: 'flex', flexDirection: 'row'}}>
      <div className="header">
        <div className="token">
          <img src={playlist.token ? jookiTokenImgUrl(playlist.token) : "/nocover.jpg"} />
        </div>
        <div className="meta">
          <div className="title">{playlist.name}</div>
          <div className="size">
            {playlist.tracks.length}
            {playlist.tracks.length === 1 ? ' song' : ' songs'}
            {' \u2022 '}{dur}
            {' \u2022 '}{size}
          </div>
        </div>
      </div>
      <JookiControls
        playbackInfo={playbackInfo}
        controlAPI={controlAPI}
      />
    </div>
  );
};

const defaultColumns = [
  Object.assign({}, COLUMNS.PLAYLIST_POSITION, { width: 100 /*1*/ }),
  Object.assign({}, COLUMNS.TRACK_TITLE,       { width: 11 /*15*/ }),
  Object.assign({}, COLUMNS.TIME,              { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.ARTIST,            { width: 11 /*10*/ }),
  Object.assign({}, COLUMNS.ALBUM_TITLE,       { width: 11 /*12*/ }),
  Object.assign({}, COLUMNS.EMPTY,             { width: 1 }),
];

export const JookiTrackBrowser = ({
  device,
  playlist,
  search,
}) => {
  const [playbackInfo, setPlaybackInfo] = useState({});
  const [controlAPI, setControlAPI] = useState({});

  const onDelete = (tracks) => {
    console.debug('jooki %o onDelete(%o)', playlist, tracks);
    device.api.deletePlaylistTracks(playlist, tracks);
  };
  const onReorder = (pl, index, tracks) => {
    console.debug('jooki %o onReorder(%o)', playlist, { pl, index, tracks });
    device.api.reorderTracks(pl, index, tracks);
  };

  return (
    <div className="jookiPlaylist">
      <JookiPlayer
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
      <JookiPlaylistHeader
        playlist={playlist}
        playbackInfo={playbackInfo}
        controlAPI={controlAPI}
      />
      <TrackBrowser
        columnBrowser={false}
        columns={defaultColumns}
        tracks={playlist ? playlist.tracks : []}
        playlist={playlist}
        search={search}
        onDelete={onDelete}
        onReorder={onReorder}
        controlAPI={controlAPI}
      />
    </div>
  );
};

