import React, { useState, useEffect, useContext } from 'react';
import { LoginContext } from '../../../lib/login';
import { SonosDevicePlaylist } from './Sonos/DevicePlaylist';
import { AirplayDevicePlaylist } from './Airplay/DevicePlaylist';
import { JookiDevicePlaylist } from './Jooki/DevicePlaylist';
import { AppleDevicePlaylist } from './Apple/DevicePlaylist';
import { AndroidDevicePlaylist } from './Android/DevicePlaylist';
import { PlexDevicePlaylist } from './Plex/DevicePlaylist';

import { JookiAPI } from '../../../lib/jooki';
import { WS } from '../../../lib/ws';

export const DevicePlaylists = ({
  selected,
  onSelect,
}) => {
  const { onLoginRequired } = useContext(LoginContext);
  const [jooki, setJooki] = useState(null);
  useEffect(() => {
    const api = new JookiAPI(onLoginRequired);
    const msgHandler = msg => {
      console.debug('message: %o', msg);
      if (msg.type === 'jooki') {
        setJooki(dev => {
          const out = Object.assign({}, dev);
          msg.deltas.forEach(delta => {
            Object.entries(delta).forEach(entry => {
              out.state = Object.assign({}, out.state, { [entry[0]]: entry[1] });
            });
          });
          console.debug('set jooki device to %o', out);
          return out;
        });
        if (msg.deltas.filter(delta => !!(delta.db))) {
          console.debug('update jooki playlists');
          api.loadPlaylists()
            .then(playlists => setJooki(dev => Object.assign({}, dev, { playlists })));
        }
      }
    };
    api.loadState()
      .then(state => {
        api.loadPlaylists()
          .then(playlists => {
            const device = { api, state, playlists };
            setJooki(device);
          });
      });
    WS.on('message', msgHandler);
    return () => {
      WS.off('message', msgHandler);
    };
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
