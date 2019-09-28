import React, { useState } from 'react';
import { jookiTokenImgUrl } from './token';
import { JookiTrackList } from './TrackList';
import { TrackBrowser } from '../../TrackBrowser2';
import * as COLUMNS from '../../../lib/columns';

const JookiPlaylistHeader = ({ playlist }) => {
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
  return (
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
  );
};

const defaultColumns = [
  Object.assign({}, COLUMNS.PLAYLIST_POSITION, { width: 100 /*1*/ }),
  Object.assign({}, COLUMNS.TRACK_TITLE,       { width: 11 /*15*/ }),
  Object.assign({}, COLUMNS.TIME,              { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.ARTIST,            { width: 11 /*10*/ }),
  Object.assign({}, COLUMNS.ALBUM_TITLE,       { width: 11 /*12*/ }),
  Object.assign({}, COLUMNS.GENRE,             { width: 11 /*4*/ }),
];

export const JookiTrackBrowser = ({
  device,
  playlist,
  columns = defaultColumns,
  search = null,
  onPlay,
  onSkip,
  onDelete,
  onReorder,
}) => {
  /*
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState({});
  const [lastSelection, setLastSelection] = useState(-1);
  const onSelect = ({ event, index, rowData }) => {
    event.stopPropagation();
    event.preventDefault();
    const id = playlist.tracks[index].persistent_id;
    if (event.metaKey) {
      const sel = Object.assign({}, selected);
      if (sel[id]) {
        delete(sel[id]);
      } else {
        sel[id] = true;
      }
      setSelected(sel)
    } else if (event.shiftKey) {
      let group = [];
      if (lastSelection === -1) {
        group = [id];
      } else if (lastSelection < index) {
        group = playlist.tracks.slice(lastSelection, index + 1).map(track => track.persistent_id);
      } else {
        group = playlist.tracks.slice(index, lastSelection + 1).map(track => track.persistent_id);
      }
      const sel = Object.assign({}, selected);
      group.forEach(id => sel[id] = true);
      setSelected(sel);
    } else {
      const sel = {};
      sel[id] = true;
      setSelected(sel);
    }
    setLastSelection(index);
  };
  const onTrackPlay = ({ event, index, rowData }) => {
    
  };
  const onReorderTracks = (pl, idx, unk) => {
    console.debug('reorder %o', { pl, idx, unk });
  };
  const onDelete = (pl, sel) => {
    console.debug('delete %o', { pl, sel });
  };
  */
  return (
    <div className="jookiPlaylist">
      <JookiPlaylistHeader playlist={playlist} />
      <TrackBrowser
        columns={columns}
        tracks={playlist.tracks}
        playlist={playlist}
        search={search}
      />
      {/*
      <JookiTrackList
        playlist={playlist}
        selected={selected}
        onSelect={onSelect}
        onReorderTracks={onReorderTracks}
      />
      */}
    </div>
  );
};
