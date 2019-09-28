import React from 'react';
import { JookiDevice } from './Device';
import { HomeItem } from '../../HomeItem';

export const JookiDevicePlaylist = ({
  device,
  onOpen,
  onClose,
}) => {
  if (!device) {
    return null;
  }
  return (
    <HomeItem name="Jooki" iconSrc="/jooki.png" onOpen={onOpen}>
      <JookiDevice device={device} onClose={onClose} />
    </HomeItem>
  );
};
