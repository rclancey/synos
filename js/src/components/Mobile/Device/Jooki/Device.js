import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../../lib/theme';
import { ScreenHeader } from '../../ScreenHeader';
import { JookiPlayer } from '../../../Player/JookiPlayer';
import { JookiControls } from '../../../Jooki/Controls';
import { Calendar } from '../../../Jooki/Calendar';
import { JookiToken, TokenList } from '../../../Jooki/Token';
import { DeviceInfo } from '../../../Jooki/DeviceInfo';

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
          <JookiControls playbackInfo={playbackInfo} controlAPI={controlAPI} center={true} />
          <DeviceInfo state={device.state} />
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
      `}</style>
    </div>
  );
};
