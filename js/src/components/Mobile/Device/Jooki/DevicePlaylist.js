import React from 'react';
import { JookiDevice } from './Device';
import { HomeItem } from '../../HomeItem';

export const JookiDevicePlaylist = ({
  device,
  onOpen,
  onClose,
  setPlayer,
  ...props
}) => {
  if (!device) {
    return null;
  }
  return (
    <HomeItem name="Jooki" iconSrc="/jooki.png" onOpen={onOpen}>
      <JookiDevice device={device} setPlayer={setPlayer} onClose={onClose} {...props} />
    </HomeItem>
  );
};
