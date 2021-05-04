import React, { useState, useEffect } from 'react';
import { useAPI } from '../../../lib/useAPI';
import { JookiAPI } from '../../../lib/jooki';
import { WS } from '../../../lib/ws';

import { SonosDevicePlaylist } from './Sonos/DevicePlaylist';
import { AirplayDevicePlaylist } from './Airplay/DevicePlaylist';
import { JookiDevicePlaylist } from './Jooki/DevicePlaylist';
import { AppleDevicePlaylist } from './Apple/DevicePlaylist';
import { AndroidDevicePlaylist } from './Android/DevicePlaylist';
import { PlexDevicePlaylist } from './Plex/DevicePlaylist';


export const DevicePlaylists = ({
  selected,
  onSelect,
  setPlayer,
}) => {
  const [jooki, setJooki] = useState(null);
  const jookiAPI = useAPI(JookiAPI);
  useEffect(() => {
    const msgHandler = msg => {
      if (msg.type === 'jooki') {
        setJooki(dev => {
          const out = Object.assign({}, dev);
          msg.deltas.forEach(delta => {
            Object.entries(delta).forEach(entry => {
              if (entry[1] !== null) {
                out.state = Object.assign({}, out.state, { [entry[0]]: entry[1] });
              }
            });
          });
          return out;
        });
        if (msg.deltas.some(delta => !!delta.db)) {
          jookiAPI.loadPlaylists()
            .then(playlists => setJooki(dev => Object.assign({}, dev, { playlists })));
        }
      }
    };
    jookiAPI.loadState()
      .then(state => {
        jookiAPI.loadPlaylists()
          .then(playlists => {
            const device = { api: jookiAPI, state, playlists };
            setJooki(device);
          });
      })
      .catch(err => console.error(err));
    WS.on('message', msgHandler);
    return () => {
      WS.off('message', msgHandler);
    };
  }, [jookiAPI]);
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
        setPlayer={setPlayer}
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
