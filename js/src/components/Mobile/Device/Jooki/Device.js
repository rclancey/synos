import React, { useState, useEffect, useMemo } from 'react';
import { JookiPlayer } from '../../../Player/JookiPlayer';
import { JookiControls } from './Controls';
import { Calendar } from './Calendar';
import { JookiToken, TokenList } from './Token';
import { ScreenHeader } from '../../ScreenHeader';
import { useTheme } from '../../../../lib/theme';

export const JookiDevice = ({ device, onClose }) => {
  const colors = useTheme();
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
      <ScreenHeader
        name="Jooki"
        prev="Library"
        onClose={onClose}
      />
      <div className="content">
        <div className="header">
          <JookiControls playbackInfo={playbackInfo} controlAPI={controlAPI} />
          <div className="deviceInfo">
            <Usage {...device.state.device.diskUsage} />
            <Battery {...device.state.power} />
            <Network ip={device.state.device.ip} wifi={device.state.wifi.ssid} />
          </div>
        </div>
        <Calendar wide={false} />
        <TokenList />
        {/*<Playlists db={device.state.db} controlAPI={controlAPI} />*/}
      </div>
      <style jsx>{`
        .device {
          background-color: ${colors.background};
          height: 100vh;
        }
        .device .content {
          height: calc(100vh - 185px);
          overflow: auto;
          padding: 0 1em;
        }
        .deviceInfo {
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
};

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
  const colors = useTheme();
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
      <span className={`level fa-stack ${charging ? 'charging' : ''} ${connected ? 'connected' : ''}`}>
        <span className={`fas fa-battery-${icon} fa-stack-2x`} />
        { (connected || charging) ? (
          <span className="fas fa-bolt fa-stack-1x" />
        ) : null }
      </span>
      {' '}
      ({level.mv} mV / {Math.round((level.t / 1000) * 1.8 + 32)} {'\u00b0F'})
      <style jsx>{`
        .level {
          color: orange;
          font-size: 67%;
        }
        .level.connected {
          color: green;
        }
        .level.connected.charging {
          color: blue;
        }
        .level .fa-bolt {
          color: red;
          text-shadow: black 0px 0px 3px;
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
