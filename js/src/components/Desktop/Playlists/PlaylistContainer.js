import React, { useEffect, useCallback, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import { TrackBrowser } from '../Tracks/TrackBrowser';
import { PlaylistView } from '../Tracks/PlaylistView';

let defaultView = typeof window === 'undefined' ? 'tracks' : (window.localStorage.getItem('defaultView') || 'tracks');

export const PlaylistContainer = ({
  search,
  getPlaylist,
  onReorder,
  onDelete,
  controlAPI,
  onShowInfo,
  onShowMultiInfo,
}) => {
  const { params } = useRouteMatch();
  const { playlistId } = params;
  const [playlist, setPlaylist] = useState(null);
  const [view, setView] = useState(defaultView);
  const onToggleView = useCallback(() => setView((orig) => {
    if (orig === 'tracks') {
      return 'playlist';
    }
    return 'tracks';
  }), []);
  useEffect(() => {
    defaultView = view;
    window.localStorage.setItem('defaultView', view);
  }, [view]);
  const api = useAPI(API);
  useEffect(() => {
    if (!getPlaylist) {
      if (!api || !playlistId) {
        setPlaylist(null);
      } else {
        api.loadPlaylist(playlistId).then(setPlaylist);
      }
    } else {
      getPlaylist().then(setPlaylist);
    }
  }, [playlistId, api, getPlaylist]);
  if (playlist) {
    switch (view) {
      case 'playlist':
        return (
          <PlaylistView playlist={playlist} onToggleView={onToggleView} />
        );
      default:
        return (
          <TrackBrowser
            playlist={playlist}
            tracks={playlist.items}
            search={search}
            onReorder={onReorder}
            onDelete={onDelete}
            controlAPI={controlAPI}
            onShowInfo={onShowInfo}
            onShowMultiInfo={onShowMultiInfo}
            onToggleView={onToggleView}
          />
        );
    }
  }
  return null;
};

export default PlaylistContainer;
