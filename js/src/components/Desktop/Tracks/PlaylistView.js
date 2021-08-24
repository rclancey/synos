import React, { useState, useEffect, useCallback, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import { usePlaybackInfo, useControlAPI } from '../../Player/Context';
import { MixCover } from '../../MixCover';
import { CloseButton } from '../../Controls/CloseButton';
import { Controls, Songs } from './CollectionView';

const pluralize = (n, sing, plur) => {
  if (n === 1) {
    return `1 ${sing}`;
  }
  const p = plur || `${sing}s`;
  return `${n} ${p}`;
};

const playlistTime = (tracks) => {
  const t = tracks.reduce((sum, track) => (sum + track.total_time), 0);
  const days = Math.floor(t / 86400000);
  const hours = Math.floor((t % 86400000) / 3600000);
  const mins = Math.floor((t % 3600000) / 60000);
  const parts = [];
  if (days > 0) {
    parts.push(pluralize(days, 'day'))
    if (hours > 0) {
      parts.push(pluralize(hours, 'hour'));
    }
  } else if (hours > 0) {
    parts.push(pluralize(hours, 'hour'));
    if (mins > 0) {
      parts.push(pluralize(mins, 'minute'));
    }
  } else {
    parts.push(pluralize(mins, 'minute'));
  }
  return parts.join(', ');
};

const Header = ({ playlist, playback, controlAPI, onClose }) => (
  <div className="header">
    <style jsx>{`
      .header {
        display: flex;
        width: 100%;
      }
      .header .info {
        flex: 10;
      }
      .header .close {
        flex: 0;
        min-width: 20px;
        max-width: 20px;
      }
      .header .title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .header .artist {
        font-size: 20px;
        color: var(--highlight);
        margin-bottom: 8px;
      }
      .header .meta {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
    `}</style>
    <div className="info">
      <div className="title">{playlist.name}</div>
      <div className="meta">
        {pluralize(playlist.items.length, 'song')}
        {' \u2022 '}
        {playlistTime(playlist.items)}
      </div>
      <Controls tracks={playlist.items} playback={playback} controlAPI={controlAPI} />
    </div>
    <div className="close">
      <CloseButton onClose={onClose} />
    </div>
  </div>
);

export const PlaylistView = ({ playlist, onClose }) => {
  const playback = usePlaybackInfo();
  const controlAPI = useControlAPI();
  return (
    <div className="playlistView">
      <style jsx>{`
        .playlistView {
          display: flex;
          width: 100%;
        }
        .playlistView .coverArt {
          flex: 0;
          width: 256px;
          padding-top: 2em;
          padding-left: 2em;
        }
        .playlistView .contents {
          overflow: auto;
          margin-left: 2em;
          flex: 10;
          padding: 2em;
        }
        .playlistView :global(.header .play) {
          display: inline-block;
        }
      `}</style>
      <div className="coverArt">
        <MixCover tracks={playlist.items} size={256} />
      </div>
      <div className="contents">
        <Header
          playlist={playlist}
          playback={playback}
          controlAPI={controlAPI}
          onClose={onClose}
        />
        <Songs
          tracks={playlist.items}
          withCover
          playback={playback}
          controlAPI={controlAPI}
        />
      </div>
    </div>
  );
};

export default PlaylistView;

