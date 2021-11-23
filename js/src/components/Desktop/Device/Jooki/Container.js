import React, { useEffect, useState } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useRouteMatch } from 'react-router-dom';

import { JookiDevice } from './Device';
import Playlist from './Playlist';

export const JookiDeviceContainer = ({ setPlayer }) => {
  const { params } = useRouteMatch();
  const { playlistId } = params;
  if (!playlistId) {
    return (
      <JookiDevice setPlayer={setPlayer} />
    );
  }
  return (
    <Playlist playlistId={playlistId} setPlayer={setPlayer} />
  );
};

export default JookiDeviceContainer;
