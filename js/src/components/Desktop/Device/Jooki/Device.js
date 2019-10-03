import React, { useState, useEffect, useMemo, useContext } from 'react';
import { WS } from '../../../../lib/ws';
import { JookiPlayer } from '../../../Player/JookiPlayer';
import { JookiControls } from '../../../Jooki/Controls';
import { Calendar } from '../../../Jooki/Calendar';
import { JookiToken, TokenList } from '../../../Jooki/Token';
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

export const JookiDevice = ({ device }) => {
  const [cal, setCal] = useState([]);
  const [jooki, setJooki] = useState(device.state);
  const [playbackInfo, setPlaybackInfo] = useState({});
  const [controlAPI, setControlAPI] = useState({});
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
    device.api.loadState().then(setJooki);
    return () => {
      WS.off('message', msgHandler);
    };
  }, []);
  const playlists = useMemo(() => {
    if (!jooki || !jooki.db || !jooki.db.playlists) {
      return [];
    }
    const pls = Object.entries(jooki.db.playlists)
      .filter(entry => entry[0] !== 'TRASH')
      .map(entry => ({
        persistent_id: entry[0],
        name: entry[1].title,
        token: entry[1].star,
        tracks: entry[1].tracks,
      }));
    pls.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    return pls;
  }, [jooki.db]);
  useEffect(() => {
    fetch('/api/cron', { method: 'GET' })
      .then(resp => resp.json())
      .then(setCal);
  }, []);
  return (
    <div className="jooki device">
      <JookiPlayer
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
      <div className="header">
        <JookiControls playbackInfo={playbackInfo} controlAPI={controlAPI} />
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
