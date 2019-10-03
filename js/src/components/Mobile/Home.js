import React, { useState, useEffect } from 'react';
import { useTheme } from '../../lib/theme';
import { useAPI } from '../../lib/useAPI';
import { JookiAPI } from '../../lib/jooki';
import { HomeItem } from './HomeItem';
import { PlaylistList } from './PlaylistList';
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

export const Home = React.memo(({ children, onOpen, ...props }) => {
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
      });
  }, [api]);
  if (children) {
    return children;
  }
  return (
    <div className="home">
      <div className="header">
        <div className="title">Library</div>
      </div>
      <div className="items">
        <HomeItem name="Playlists" icon="playlists" onOpen={onOpen}>
          <PlaylistList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Artists" icon="artists" onOpen={onOpen}>
          <ArtistList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Albums" icon="albums" onOpen={onOpen}>
          <AlbumList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Genres" icon="genres" onOpen={onOpen}>
          <GenreList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Podcasts" icon="podcasts" onOpen={onOpen}>
          <PodcastList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Audiobooks" icon="audiobooks" onOpen={onOpen}>
          <AudiobookList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Recently Added" icon="recent" onOpen={onOpen}>
          <RecentAdditions prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Purchases" icon="purchased" onOpen={onOpen}>
          <Purchases prev="Library" {...props} />
        </HomeItem>
        <SonosDevicePlaylist   device={null}  onOpen={onOpen} {...props} />
        <AirplayDevicePlaylist device={null}  onOpen={onOpen} {...props} />
        <JookiDevicePlaylist   device={jooki} onOpen={onOpen} {...props} />
        <AppleDevicePlaylist   device={null}  onOpen={onOpen} {...props} />
        <AndroidDevicePlaylist device={null}  onOpen={onOpen} {...props} />
        <PlexDevicePlaylist    device={null}  onOpen={onOpen} {...props} />
      </div>
      <style jsx>{`
        .header {
          padding: 0.5em;
          padding-top: 54px;
          background-color: ${colors.sectionBackground};
        }
        .header .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          color: ${colors.highlightText};
        }
        .items {
          width: 100vw;
          height: calc(100vh - 185px);
          overflow: auto;
          padding: 0 0.5em;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
});
