import React, { useState, useEffect, useContext } from 'react';
import { LoginContext } from '../../../lib/login';
import { SonosDevicePlaylist } from './Sonos/DevicePlaylist';
import { AirplayDevicePlaylist } from './Airplay/DevicePlaylist';
import { JookiDevicePlaylist } from './Jooki/DevicePlaylist';
import { AppleDevicePlaylist } from './Apple/DevicePlaylist';
import { AndroidDevicePlaylist } from './Android/DevicePlaylist';
import { PlexDevicePlaylist } from './Plex/DevicePlaylist';

import { JookiAPI } from '../../../lib/jooki';

export const DevicePlaylists = ({
  selected,
  onSelect,
}) => {
  const { onLoginRequired } = useContext(LoginContext);
  const [jooki, setJooki] = useState(null);
  useEffect(() => {
    const api = new JookiAPI(onLoginRequired);
    api.loadState()
      .then(state => {
        api.loadPlaylists()
          .then(playlists => {
            const device = { api, state, playlists };
            setJooki(device);
          });
      });
  }, [onLoginRequired]);
  return (
    <>
      <h1>Devices</h1>
      <SonosDevicePlaylist
        device={null}
      />
      <AirplayDevicePlaylist
        device={null}
      />
      <JookiDevicePlaylist
        device={jooki}
        selected={selected}
        onSelect={onSelect}
      />
      <AppleDevicePlaylist
        device={null}
      />
      <AppleDevicePlaylist
        device={null}
      />
      <AndroidDevicePlaylist
        device={null}
      />
      <PlexDevicePlaylist
        device={null}
      />
    </>
  );
};
