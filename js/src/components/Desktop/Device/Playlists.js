import React, { useState, useEffect } from 'react';

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
  return (
    <>
      <h1>Devices</h1>
      <AirplayDevicePlaylist
        device={null}
      />
      <AndroidDevicePlaylist
        device={null}
      />
      <AppleDevicePlaylist
        device={null}
      />
      <JookiDevicePlaylist
        selected={selected}
        onSelect={onSelect}
        setPlayer={setPlayer}
      />
      <PlexDevicePlaylist
        device={null}
      />
      <SonosDevicePlaylist
        device={null}
      />
    </>
  );
};
