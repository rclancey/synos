import React, { useState, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';

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
import { Settings } from '../Settings';

import CassetteIcon from '../icons/Cassette';
import GuitarPlayerIcon from '../icons/GuitarPlayer';
import RecordIcon from '../icons/Record';
import DrumKitIcon from '../icons/DrumKit';
import BroadcastMicrophoneIcon from '../icons/BroadcastMicrophone';
import AudiobookIcon from '../icons/Audiobook';
import TimerIcon from '../icons/Timer';
import ShoppingCartIcon from '../icons/ShoppingCart';
import SearchIcon from '../icons/Search';
import GearIcon from '../icons/Gear';

export const Home = React.memo(({ children, onOpen, ...props }) => {
  /*
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
  */
  if (children) {
    return children;
  }
  return (
    <div className="home">
      <ScreenHeader name="Library" />
      <div className="items">
        <HomeItem path="/playlists" name="Playlists" icon={CassetteIcon} />
        <HomeItem path="/artists" name="Artists" icon={GuitarPlayerIcon} />
        <HomeItem path="/albums" name="Albums" icon={RecordIcon} />
        <HomeItem path="/genres" name="Genres" icon={DrumKitIcon} />
        <HomeItem path="/podcasts" name="Podcasts" icon={BroadcastMicrophoneIcon} />
        <HomeItem path="/audiobooks" name="Audiobooks" icon={AudiobookIcon} />
        <HomeItem path="/recents" name="Recently Added" icon={TimerIcon} />
        <HomeItem path="/purchases" name="Purchases" icon={ShoppingCartIcon} />
        {/*
        <SonosDevicePlaylist   device={null}  onOpen={stack.onPush} {...props} />
        <AirplayDevicePlaylist device={null}  onOpen={stack.onPush} {...props} />
        <JookiDevicePlaylist   device={jooki} onOpen={stack.onPush} {...props} />
        <AppleDevicePlaylist   device={null}  onOpen={stack.onPush} {...props} />
        <AndroidDevicePlaylist device={null}  onOpen={stack.onPush} {...props} />
        <PlexDevicePlaylist    device={null}  onOpen={stack.onPush} {...props} />
        */}
        <HomeItem path="/search" name="Search" icon={SearchIcon} />
        <HomeItem path="/settings" name="Settings" icon={GearIcon} />
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
          overflow: auto;
        }
      `}</style>
    </div>
  );
});
