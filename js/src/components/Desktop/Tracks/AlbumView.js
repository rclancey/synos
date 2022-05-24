import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useRouteMatch } from 'react-router-dom';

import { ThemeContext } from '../../../lib/theme';
import { TH } from '../../../lib/trackList';
import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import { usePlaybackInfo, useControlAPI } from '../../Player/Context';
import { CoverArt } from '../../CoverArt';
import { CloseButton } from '../../Controls/CloseButton';
import { Controls, Songs } from './CollectionView';

const releaseYear = (track) => {
  if (track.year) {
    return track.year;
  }
  if (track.release_date) {
    return new Date(track.release_date).getFullYear();
  }
};

const Header = ({ tracks, playback, controlAPI, onClose }) => (
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
        color: var(--muted-text);
      }
    `}</style>
    <div className="info">
      <div className="title">{tracks[0].album}</div>
      <div className="artist">{tracks[0].album_artist || tracks[0].artist}</div>
      <div className="meta">
        {tracks[0].genre}
        {' \u2022 '}
        {releaseYear(tracks[0])}
      </div>
      <Controls tracks={tracks} playback={playback} controlAPI={controlAPI} />
    </div>
    {/*
    <div className="close">
      <CloseButton onClose={onClose} />
    </div>
    */}
  </div>
);

export const AlbumView = ({ artist, album, playback, controlAPI }) => {
  const { setDarkMode, setTheme } = useContext(ThemeContext);
  const api = useAPI(API);
  useEffect(() => {
    if (album.tracks) {
      api.trackColor(album.tracks).then((color) => {
        if (color) {
          setDarkMode(color.dark);
          setTheme(color.theme);
        }
      });
    }
  }, [setDarkMode, setTheme, api, album]);
  return (
    <div className="albumView">
      <style jsx>{`
        .albumView {
          display: flex;
          width: 100%;
        }
        .albumView .coverArt {
          flex: 0;
          width: 256px;
          padding-top: 2em;
          padding-left: 2em;
          padding-bottom: 2em;
        }
        .albumView .contents {
          flex: 10;
          overflow: overlay;
          padding: 2em;
        }
        .albumView :global(.header .play) {
          display: inline-block;
        }
      `}</style>
      <div className="coverArt">
        <CoverArt track={album.tracks[0]} size={256} />
      </div>
      <div className="contents">
        <Header
          tracks={album.tracks}
          playback={playback}
          controlAPI={controlAPI}
        />
        <Songs
          tracks={album.tracks}
          playback={playback}
          controlAPI={controlAPI}
        />
      </div>
    </div>
  );
};

export default AlbumView;
