import React, { useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { StackContext, usePages } from './Router/StackContext';
import { Stack } from './Router/Stack';
import { Home } from './Home';
import { TrackMenu, PlaylistMenu, MenuContext, useMenus } from './TrackMenu';
import { Controls } from './NowPlaying';
import { useTheme } from '../../lib/theme';
import { useControlAPI } from '../Player/Context';
import { WithRouter } from '../../lib/router';
import { BackButton } from './BackButton';
import { Screen } from './Screen';

export const MobileSkin = ({
  theme,
  dark,
  player,
  setPlayer,
  setControlAPI,
  setPlaybackInfo,
}) => {
  const controlAPI = useControlAPI();

  const colors = useTheme();
  const pages = usePages();
  const menus = useMenus();

  useEffect(() => {
    const handler = (evt) => {
      console.debug(evt);
    };
    window.addEventListener('popstate', handler);
    window.addEventListener('pushstate', handler);
    if (pages.pages.length === 0) {
      pages.onPush('Library', <Home controlAPI={controlAPI} setPlayer={setPlayer} />);
    }
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('pushstate', handler);
    };
  // eslint-disable-next-line
  }, []);
  /*
  const onOpen = setChildren;
  const onClose = useCallback(() => setChildren(null), [setChildren]);
  const onList = useCallback((args) => {
    if (args.album) {
      const album = {
        artist: {
          sort: args.album.sort_album_artist || args.album.sort_artist,
        },
        sort: args.album.sort_album,
      };
      onOpen(<Album
        prev={{ name: "Library" }}
        album={album}
        controlAPI={controlAPI}
        onClose={onClose}
        onTrackMenu={onTrackMenu}
        onPlaylistMenu={onPlaylistMenu}
      />);
    } else if (args.artist) {
      const artist = {
        sort: args.artist.sort_artist || args.sort_album_artist,
      };
      onOpen(<AlbumList
        prev="Library"
        artist={artist}
        controlAPI={controlAPI}
        onClose={onClose}
        onTrackMenu={onTrackMenu}
        onPlaylistMenu={onPlaylistMenu}
      />);
    }
  }, [onOpen]);
  */

  useEffect(() => {
    document.body.style.background = dark ? 'black' : 'white';
  }, [dark]);

  const onList = null;
  return (
    <div id="app" className={`mobile ${theme} ${dark ? 'dark' : 'light'}`}>
      <style jsx>{`
        #app {
          background: var(--gradient);
        }
      `}</style>
  {/*
    <WithRouter
      state={null}
      title="Library"
      url="/"
    >
      <Screen />
      <Controls
        player={player}
        setPlayer={setPlayer}
        setControlAPI={setControlAPI}
        setPlaybackInfo={setPlaybackInfo}
        onList={onList}
      />
    </WithRouter>
  */}
      <StackContext.Provider value={pages}>
        <MenuContext.Provider value={menus}>
          <Stack />
        </MenuContext.Provider>
      </StackContext.Provider>

      <Controls
        player={player}
        setPlayer={setPlayer}
        setControlAPI={setControlAPI}
        setPlaybackInfo={setPlaybackInfo}
        onList={onList}
      />

      {menus.trackMenuTrack ? (
        <StackContext.Provider value={pages}>
          <TrackMenu
            menus={menus}
            track={menus.trackMenuTrack}
            onClose={() => menus.onTrackMenu(null)}
            controlAPI={controlAPI}
          />
        </StackContext.Provider>
      ) : null}
      {menus.playlistMenuTracks ? (
        <StackContext.Provider value={pages}>
          <PlaylistMenu
            menus={menus}
            name={menus.playlistMenuTitle}
            tracks={menus.playlistMenuTracks}
            onClose={() => menus.onPlaylistMenu(null, null)}
            controlAPI={controlAPI}
          />
        </StackContext.Provider>
      ) : null}
      <style jsx>{`
        #app {
          height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default MobileSkin;
