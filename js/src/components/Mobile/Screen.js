import React, { useContext, useMemo, useState } from 'react';

import RouterContext from '../../lib/router';

import { Home } from './Home';
import { PlaylistWrapper, PlaylistFolder } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList } from './AlbumList';
import { GenreList } from './GenreList';
import { Playlist, Album } from './SongList';
import { PodcastList } from './PodcastList';
import { AudiobookList } from './AudiobookList';
import { Purchases } from './Purchases';
import { RecentAdditions } from './RecentAdditions';
import { Search } from './Search';

const routes = [
  { path: '/', Component: Home },
  { path: '/playlists' },
  { path: new RegExp('^/playlists/(.*)$'), args: ['persistent_id'], Component: PlaylistWrapper },
  { path: '/artists', Component: ArtistList },
  { path: new RegExp('^/artists/(.*)$'), args: ['artist_name'], Component: AlbumList },
  { path: '/albums', Component: AlbumList },
  { path: new RegExp('^/albums/(.*)/(.*)$'), args: ['artist_name', 'album_name'], Component: Album },
  { path: '/genres', Component: GenreList },
  { path: new RegExp('^/genres/(.*)$'), args: ['genre_name'], Component: AlbumList },
  { path: '/podcasts', Component: PodcastList },
  { path: '/audiobooks', Component: AudiobookList },
  { path: '/purchases', Component: Purchases },
  { path: '/recents', Component: RecentAdditions },
  { path: '/search', Component: Search },
];

const useRoute = () => {
  const { state, history, url } = useContext(RouterContext);
  const { Component, args } = useMemo(() => routes.map((route) => {
    const { path, args } = route;
    if (typeof path === 'string') {
      return url === path ? route : null;
    }
    const m = url.match(path);
    if (!m) {
      return null;
    }
    const pathArgs = {};
    m.slice(1).forEach((v, i) => {
      pathArgs[args[i]] = v;
    });
    return {
      ...route,
      args: pathArgs,
    };
  }).find((route) => route !== null), [url]);
  const prev = useMemo(() => {
    if (history.length > 1) {
      return history[history.length - 2];
    };
    return null;
  }, [history]);
  return {
    Component,
    props: { ...args, ...state, prev },
  };
};

export const Screen = () => {
  const { Component, props } = useRoute();
  return (<Component {...props} />);
};

export default Screen;
