import React, { useState, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useTheme } from '../../lib/theme';
import { useStack } from './Router/StackContext';
import { useAPI } from '../../lib/useAPI';
import { JookiAPI } from '../../lib/jooki';
import { ScreenHeader } from './ScreenHeader';
import { HomeItem } from './HomeItem';
import { PlaylistFolder } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList } from './AlbumList';
import { GenreList } from './GenreList';
import { PodcastList } from './PodcastList';
import { AudiobookList } from './AudiobookList';
import { Purchases } from './Purchases';
import { RecentAdditions } from './RecentAdditions';
import { SonosDevicePlaylist } from './Device/Sonos/DevicePlaylist';
import { AirplayDevicePlaylist } from './Device/Airplay/DevicePlaylist';
import { JookiDevicePlaylist } from './Device/Jooki/DevicePlaylist';
import { AppleDevicePlaylist } from './Device/Apple/DevicePlaylist';
import { AndroidDevicePlaylist } from './Device/Android/DevicePlaylist';
import { PlexDevicePlaylist } from './Device/Plex/DevicePlaylist';
import { Search } from './Search';

import CassetteIcon from '../icons/Cassette';
import GuitarPlayerIcon from '../icons/GuitarPlayer';
import RecordIcon from '../icons/Record';
import DrumKitIcon from '../icons/DrumKit';
import BroadcastMicrophoneIcon from '../icons/BroadcastMicrophone';
import AudiobookIcon from '../icons/Audiobook';
import TimerIcon from '../icons/Timer';
import ShoppingCartIcon from '../icons/ShoppingCart';
import SearchIcon from '../icons/Search';

export const Home = React.memo(({ children, onOpen, ...props }) => {
  const stack = useStack();
  const colors = useTheme();
  const [jooki, setJooki] = useState(null);
  const api = useAPI(JookiAPI);
  useEffect(() => {
    api.loadState()
      .then(state => {
        api.loadPlaylists()
          .then(playlists => {
            const device = { api, state, playlists };
            setJooki(device);
          });
      })
      .catch(err => {
        console.debug('error loading jooki: %o', err);
      });
  }, [api]);
  /*
  useEffect(() => {
    const playlistPathStr = window.localStorage.getItem('playlistPath');
    const playlistPath = JSON.parse(playlistPathStr || '[]');
    if (playlistPath && playlistPath.length > 0) {
      stack.onPush(<PlaylistList prev="Library" forcePath={playlistPath} {...props} />);
    }
  // eslint-disable-next-line
  }, []);
  */
  if (children) {
    return children;
  }
  return (
    <div className="home">
      <ScreenHeader name="Library" />
      <div className="items">
        <HomeItem name="Playlists" icon={CassetteIcon} onOpen={stack.onPush}>
          <PlaylistFolder prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Artists" icon={GuitarPlayerIcon} onOpen={stack.onPush}>
          <ArtistList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Albums" icon={RecordIcon} onOpen={stack.onPush}>
          <AlbumList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Genres" icon={DrumKitIcon} onOpen={stack.onPush}>
          <GenreList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Podcasts" icon={BroadcastMicrophoneIcon} onOpen={stack.onPush}>
          <PodcastList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Audiobooks" icon={AudiobookIcon} onOpen={stack.onPush}>
          <AudiobookList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Recently Added" icon={TimerIcon} onOpen={stack.onPush}>
          <RecentAdditions prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Purchases" icon={ShoppingCartIcon} onOpen={stack.onPush}>
          <Purchases prev="Library" {...props} />
        </HomeItem>
        {/*
        <SonosDevicePlaylist   device={null}  onOpen={stack.onPush} {...props} />
        <AirplayDevicePlaylist device={null}  onOpen={stack.onPush} {...props} />
        <JookiDevicePlaylist   device={jooki} onOpen={stack.onPush} {...props} />
        <AppleDevicePlaylist   device={null}  onOpen={stack.onPush} {...props} />
        <AndroidDevicePlaylist device={null}  onOpen={stack.onPush} {...props} />
        <PlexDevicePlaylist    device={null}  onOpen={stack.onPush} {...props} />
        */}
        <HomeItem name="Search" icon={SearchIcon} onOpen={stack.onPush}>
          <Search prev="Library" {...props} />
        </HomeItem>
      </div>
      <style jsx>{`
        .header {
          padding: 0.5em;
          padding-top: 54px;
          background: var(--contrast3);
        }
        .header .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          color: var(--highlight);
        }
        .items {
          width: 100vw;
          height: calc(100vh - 185px);
          padding: 0 0.5em;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
});
