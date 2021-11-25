import React, { useCallback, useMemo, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import history from 'history';
import {
  BrowserRouter as Router,
  Route,
  useRouteMatch,
  useHistory,
  generatePath,
} from 'react-router-dom';

import { Home } from './Home';
import { TrackMenu, PlaylistMenu, MenuContext, useMenus } from './TrackMenu';
import { Controls } from './NowPlaying';
import { useControlAPI } from '../Player/Context';
import { setTheme } from '../../lib/theme';
//import { BackButton } from './BackButton';
import { Back } from './ScreenHeader';
//import { Screen } from './Screen';
import { PlaylistContainer } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList, AlbumContainer } from './AlbumList';
import { GenreList } from './GenreList';
import { RecentAdditions } from './RecentAdditions';
import { PodcastList } from './PodcastList';
import { AudiobookList } from './AudiobookList';
import { Purchases } from './Purchases';
import { Search } from './Search';
import { Settings} from '../Settings';
import { AddMusic } from './AddMusic';

export const MobileSkin = ({
  theme,
  dark,
  player,
  setPlayer,
  setControlAPI,
  setPlaybackInfo,
}) => {
  const controlAPI = useControlAPI();

  const menus = useMenus();

  const onList = null;
  return (
    <div id="app" className={`mobile ${theme} ${dark ? 'dark' : 'light'}`}>
      <style jsx>{`
        #app {
          background: var(--gradient);
          height: 100vh;
        }
      `}</style>
      <MenuContext.Provider value={menus}>
        <Router>
          <Route path="/:stuff">
            <Back />
          </Route>
          {/*
          <Route path="/:stuff" children={Header} />
          */}
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/playlists">
            <PlaylistContainer />
          </Route>
          <Route path="/playlists/:playlistId">
            <PlaylistContainer />
          </Route>
          <Route exact path="/artists">
            <ArtistList />
          </Route>
          <Route exact path="/artists/:artistName">
            <AlbumList />
          </Route>
          <Route exact path="/albums">
            <AlbumList />
          </Route>
          <Route exact path="/albums/:artistName/:albumName">
            <AlbumContainer />
          </Route>
          <Route exact path="/genres">
            <GenreList />
          </Route>
          <Route exact path="/genres/:genreName">
            <ArtistList />
          </Route>
          <Route path="/podcasts">
            <PodcastList />
          </Route>
          <Route path="/audiobooks">
            <AudiobookList />
          </Route>
          <Route path="/recents">
            <RecentAdditions />
          </Route>
          <Route path="/purchases">
            <Purchases />
          </Route>
          <Route path="/search">
            <Search />
          </Route>
          <Route path="/settings">
            <Settings />
          </Route>
          <Route path="/addTo/:playlistId">
            <AddMusic />
          </Route>

          <Controls
            player={player}
            setPlayer={setPlayer}
            setControlAPI={setControlAPI}
            setPlaybackInfo={setPlaybackInfo}
            onList={onList}
          />

          {menus.trackMenuTrack ? (
            <TrackMenu
              menus={menus}
              track={menus.trackMenuTrack}
              onClose={() => menus.onTrackMenu(null)}
              controlAPI={controlAPI}
            />
          ) : null}
          {menus.playlistMenuTracks ? (
            <PlaylistMenu
              menus={menus}
              name={menus.playlistMenuTitle}
              tracks={menus.playlistMenuTracks}
              onClose={() => menus.onPlaylistMenu(null, null)}
              controlAPI={controlAPI}
            />
          ) : null}
        </Router>
      </MenuContext.Provider>
    </div>
  );
};

export default MobileSkin;
