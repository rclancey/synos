import React, { useState, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";
import { useTheme } from '../../../lib/theme';
import { MixCover } from '../../MixCover';
import { EditPlaylist } from './EditPlaylist';
import Random from '../../../assets/icons/random.svg';
import Play from '../../../assets/icons/play.svg';
import Insert from '../../../assets/icons/insert.svg';
import Append from '../../../assets/icons/append.svg';

const plural = (n, singular, plural) => {
  return `${n} ${n === 1 ? singular : (plural || singular+'s')}`;
};

export const PlaylistInfo = ({ name, tracks, smart, onEdit }) => {
  const colors = useTheme();
  const durm = tracks.reduce((acc, tr) => acc + tr.total_time, 0) / 60000;
  const sizem = tracks.reduce((acc, tr) => acc + tr.size, 0) / (1024 * 1024);
  let dur = '';
  if (durm > 36 * 60) {
    const days = Math.floor(durm / (24 * 60));
    const hours = Math.round((durm % (24 * 60)) / 60);
    dur = `${plural(days, 'day')}, ${plural(hours, 'hour')}`;
  } else if (durm > 60) {
    const hours = Math.floor(durm / 60);
    const mins = Math.round(durm % 60);
    dur = `${hours}:${mins < 10 ? '0' + mins : mins}`;
  } else {
    const mins = Math.round(durm * 10) / 10;
    dur = plural(mins, 'minute');
  }
  let size = '';
  if (sizem >= 10240) {
    size = `${Math.round(sizem / 1024)} GB`;
  } else if (sizem > 1024) {
    size = `${Math.round(sizem / 102.4) / 10} GB`;
  } else {
    size = `${Math.round(sizem)} MB`;
  }
  return (
    <div className="playlistInfo">
      <div className="title">{name}</div>
      <div className="size">
        { plural(tracks.length, 'song') }
        { ' \u2022 ' }{ dur }
        { ' \u2022 ' }{ size }
        { smart ? (
          <>
            {' \u00a0\u00a0\u00a0 '}
            <span className="edit" onClick={onEdit}>Edit Rules</span>
          </>
        ) : null }
      </div>
      <style jsx>{`
        .playlistInfo {
          flex: 10;
          margin-left: 2em;
          margin-right: 2em;
          padding-top: 1em;
        }
        .playlistInfo .title {
          font-weight: bold;
          font-size: 24px;
        }
        .playlistInfo .edit {
          text-decoration: none;
          color: var(--highlight);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export const QueueButton = ({ title, icon, onClick }) => {
  const colors = useTheme();
  return (
    <div className="item" onClick={onClick}>
      <div className="icon" />
      <div className="title">{title}</div>
      <style jsx>{`
        .item {
          padding: 0;
          margin-bottom: 3px;
          display: flex;
        }
        .item .icon {
          width: 18px;
          height: 18px;
          background-color: var(--highlight);
          mask: url(${icon});
          mask-size: contain;
          mask-repeat: no-repeat;
        }
        .title {
          margin: 0;
          padding: 0;
          margin-left: 0.5em;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export const Shuffle = ({ persistent_id, tracks, controlAPI }) => (
  <QueueButton
    title="Shuffle"
    icon={Random}
    onClick={() => {
      if (controlAPI.onReplaceQueue) {
        const source = tracks.slice(0);
        const shuffled = [];
        while (source.length > 0) {
          const n = Math.floor(Math.random() * source.length);
          shuffled.push(source[n]);
          source.splice(n, 1);
        }
        controlAPI.onReplaceQueue(shuffled)
          .then(() => controlAPI.onPlay());
      } else {
        controlAPI.onSetPlaylist(persistent_id, 0)
          .then(() => controlAPI.onShuffle())
          .then(() => controlAPI.onPlay());
      }
    }}
  />
);

export const PlayNow = ({ persistent_id, tracks, controlAPI }) => {
  return (
    <QueueButton
      title="Play Now"
      icon={Play}
      onClick={() => {
        if (controlAPI.onReplaceQueue) {
          controlAPI.onReplaceQueue(tracks)
            .then(() => controlAPI.onPlay());
        } else {
          controlAPI.onSetPlaylist(persistent_id, 0)
            .then(() => controlAPI.onPlay());
        }
      }}
    />
  );
};

export const PlayNext = ({ tracks, controlAPI }) => {
  if (!controlAPI.onInsertIntoQueue) {
    return null;
  }
  return (
    <QueueButton
      title="Play Next"
      icon={Insert}
      onClick={() => {
        controlAPI.onInsertIntoQueue(tracks)
          .then(() => controlAPI.onPlay());
      }}
    />
  );
};

export const PlayLater = ({ tracks, controlAPI }) => {
  if (!controlAPI.onAppendToQueue) {
    return null;
  }
  return (
    <QueueButton
      title="Play Later"
      icon={Append}
      onClick={() => {
        controlAPI.onAppendToQueue(tracks)
          .then(() => controlAPI.onPlay());
      }}
    />
  );
};

export const PlaylistHeader = ({
  playlist,
  controlAPI,
}) => {
  const colors = useTheme();
  const [editing, setEditing] = useState(false);
  const onEdit = useCallback(() => setEditing(true), []);
  const onSavePlaylist = useCallback((pl) => {
    console.debug('onSavePlaylist(%o)', pl);
    setEditing(false);
  }, []);
  return (
    <div className="playlistHeader">
      { editing && <EditPlaylist playlist={playlist} onSavePlaylist={onSavePlaylist} onCancel={() => setEditing(false)} /> }
      <MixCover tracks={playlist.items || playlist.tracks} size={120} />
      <PlaylistInfo name={playlist.name} tracks={playlist.items || playlist.tracks} smart={playlist.smart} onEdit={onEdit} />
      <div className="queueOptions">
        <PlayNow persistent_id={playlist.persistent_id} tracks={playlist.items || playlist.tracks} controlAPI={controlAPI} />
        <Shuffle persistent_id={playlist.persistent_id} tracks={playlist.items || playlist.tracks} controlAPI={controlAPI} />
        <PlayNext tracks={playlist.items || playlist.tracks} controlAPI={controlAPI} />
        <PlayLater tracks={playlist.items || playlist.tracks} controlAPI={controlAPI} />
      </div>
      <style jsx>{`
        .playlistHeader {
          display: flex;
          padding: 2em;
          /*
          background-color: ${colors.sectionBackground};
          */
          border-bottom: solid ${colors.trackList.separator} 1px;
        }
      `}</style>
    </div>
  );
};

