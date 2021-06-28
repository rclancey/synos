import React, { useState, useEffect } from 'react';
import { WS } from '../../../../lib/ws';
import { Calendar } from '../../../Jooki/Calendar';
import { TokenList } from '../../../Jooki/Token';
import { DeviceInfo } from '../../../Jooki/DeviceInfo';

const merge = (orig, delta) => {
  if (delta === null) {
    return orig;
  }
  if (orig === null || orig === undefined) {
    return delta;
  }
  if (Array.isArray(orig)) {
    if (Array.isArray(delta)) {
      return delta;
    }
    return orig.concat([delta]);
  }
  if (typeof delta === 'object') {
    if (typeof orig === 'object') {
      const out = Object.assign({}, orig);
      Object.entries(delta).forEach(entry => out[entry[0]] = merge(orig[entry[0]], entry[1]));
      return out;
    }
  }
  return delta;
};

export const JookiDevice = ({ device, setPlayer }) => {
  const [jooki, setJooki] = useState(device.state);
  const api = device.api;
  useEffect(() => {
    setPlayer('jooki');
    return () => {
      setPlayer(null);
    };
  }, [setPlayer]);
  useEffect(() => {
    const msgHandler = msg => {
      if (msg.type === 'jooki') {
        setJooki(state => {
          let out = state;
          msg.deltas.forEach(delta => {
            out = merge(out, delta);
          });
          console.debug('set jooki device to %o', out);
          return out;
        });
      }
    };
    WS.on('message', msgHandler);
    api.loadState().then(setJooki);
    return () => {
      WS.off('message', msgHandler);
    };
  }, [api]);

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
        <DeviceInfo state={jooki} />
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
