import React, { useState, useEffect } from 'react';
import _JSXStyle from "styled-jsx/style";

import { useJooki } from '../../../../lib/jooki';
import { Calendar } from '../../../Jooki/Calendar';
import { TokenList } from '../../../Jooki/Token';
import { DeviceInfo } from '../../../Jooki/DeviceInfo';

export const JookiDevice = ({ setPlayer }) => {
  const { state } = useJooki();
  if (!state) {
    return null;
  }
  return (
    <div className="jooki device">
      {/*
      <JookiPlayer
        setTiming={() => {}}
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
      */}
      <div className="header">
        {/*
        <JookiControls playbackInfo={playbackInfo} controlAPI={controlAPI} />
        */}
        <DeviceInfo state={state} />
      </div>
      <Calendar />
      <TokenList />
      <style jsx>{`
        .jooki.device {
          width: 100%;
          max-height: 100%;
          overflow: auto;
        }
        .header {
          display: flex;
          flex-direction: row;
        }
        .jooki :global(.deviceInfo) {
          margin: 0;
          padding: 1em;
        }
      `}</style>
    </div>
  );
};

/*
const NowPlaying = ({ playlistId, source, artist, track, nfc }) => (
  <div className="current">
    { nfc && nfc.starId ? (
      <JookiToken size={50} starId={nfc.starId} />
    ) : null }
    <div className="trackInfo">
      <div>{source}</div>
      <div>{track} by {artist}</div>
    </div>
    <style jsx>{`
      .current {
        display: flex;
        flex-direction: row;
      }
      .trackInfo {
        flex: 10;
        margin-left: 1em;
      }
    `}</style>
  </div>
);
*/
