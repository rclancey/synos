import React, { useState, useEffect, useMemo, useContext } from 'react';
import { JookiPlayer } from '../../../Player/JookiPlayer';
import { JookiControls } from './Controls';
import { Calendar } from './Calendar';
import { JookiToken, TokenList } from './Token';

export const JookiDevice = ({ device }) => {
  const [cal, setCal] = useState([]);
  const [playbackInfo, setPlaybackInfo] = useState({});
  const [controlAPI, setControlAPI] = useState({});
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
        <div className="deviceInfo">
          <NowPlaying nfc={device.state.nfc} {...device.state.audio.nowPlaying} />
          <Usage {...device.state.device.diskUsage} />
          <Battery {...device.state.power} />
          <Network ip={device.state.device.ip} wifi={device.state.wifi.ssid} />
          {/*JSON.stringify(device.state, null, "  ")*/}
        </div>
      </div>
      <Calendar />
      <TokenList />
      <style jsx>{`
        .jooki.device {
          max-height: 100%;
          overflow: auto;
        }
        .header {
          display: flex;
          flex-direction: row;
        }
        .deviceInfo {
          /*
          font-family: monospace;
          white-space: pre;
          color: white;
          */
          padding: 1em;
        }
      `}</style>
    </div>
  );
};

/*
"state": {
    "DISABLEDsettings": {
      "quietTime": {
        "active": false,
        "shutdown": {
          "hour": 0,
          "minute": 0
        }
      }
    },
    "audio": {
      "config": {
        "repeat_mode": 0,
        "shuffle_mode": false,
        "volume": 31
      },
      "nowPlaying": {
        "album": "By Request... The Best of John Williams and the Boston Pops",
        "artist": "John Williams & The Boston Pops Orchestra",
        "audiobook": false,
        "duration_ms": 335542.857,
        "hasNext": true,
        "hasPrev": true,
        "image": "/artwork/3da5cb956ac0e904.jpg",
        "playlistId": "user_1562798198",
        "service": "FILE",
        "source": "Classical",
        "track": "Main Theme from STAR WARS",
        "trackId": "3da5cb956ac0e904",
        "trackIndex": 17,
        "uri": "file:///jooki/external/jooki/uploads/3da5cb956ac0e904"
      },
      "playback": {
        "position_ms": 0,
        "state": "STARTING"
      }
    },
    "bt": "",
*/

const formatSize = (n) => {
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 10240) {
    return `${(n / 1024).toFixed(1)} kB`;
  }
  if (n < 1024 * 1024) {
    return `${Math.round(n / 1024)} kB`;
  }
  if (n < 10240 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (n < 1024 * 1024 * 1024) {
    return `${Math.round(n / (1024 * 1024))} MB`;
  }
  if (n < 10240 * 1024 * 1024) {
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `${Math.round(n / (1024 * 1024 * 1024))} GB`;
};

const Usage = ({ available, total, used, usedPercent }) => (
  <div className="usage">
    <b>Usage:</b>
    {' '}
    {formatSize(used * 1024)} of {formatSize(total * 1024)} ({(100 * used / total).toFixed(1)}%)
  </div>
);

const Battery = ({ charging, connected, level }) => {
  let icon;
  if (level.p < 125) {
    icon = 'empty';
  } else if (level.p < 375) {
    icon = 'quarter';
  } else if (level.p < 625) {
    icon = 'half';
  } else if (level.p < 875) {
    icon = 'three-quarters';
  } else {
    icon = 'full';
  }
  return (
    <div className="battery">
      <b>Battery:</b>
      {' '}
      {(level.p / 10).toFixed(1)}%
      {' '}
      <span className={`level fas fa-battery-${icon} ${charging ? 'charging' : ''} ${connected ? 'connected' : ''}`} />
      {' '}
      { connected ? <span className="fas fa-plug" /> : null }
      {' '}
      ({level.mv} mV / {Math.round((level.t / 1000) * 1.8 + 32)} {'\u00b0F'})
      <style jsx>{`
        .level {
          color: orange;
        }
        .level.connected {
          color: green;
        }
        .level.connected.charging {
          color: blue;
        }
      `}</style>
    </div>
  );
};

const Network = ({ wifi, ip }) => (
  <div className="network">
    <b>Network:</b>
    {' '}{ip} / {wifi}
  </div>
);

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
