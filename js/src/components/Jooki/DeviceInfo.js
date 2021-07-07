import React from 'react';
import _JSXStyle from "styled-jsx/style";

export const DeviceInfo = ({ state }) => (
  <div className="deviceInfo">
    <Usage {...state.device.diskUsage} />
    <Battery {...state.power} />
    <Network ip={state.device.ip} wifi={state.wifi.ssid} />
    <style jsx>{`
      .deviceInfo {
        margin: 1em 0;
      }
    `}</style>
  </div>
);

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
