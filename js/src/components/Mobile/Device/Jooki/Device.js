import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../../lib/theme';
import { Icon } from '../../../Icon';
import { ScreenHeader } from '../../ScreenHeader';
import { JookiControls } from '../../../Jooki/Controls';
import { Calendar } from '../../../Jooki/Calendar';
import { TokenList } from '../../../Jooki/Token';
import { DeviceInfo } from '../../../Jooki/DeviceInfo';
import { Playlists } from './Playlists';

export const JookiDevice = ({ device, setPlayer, onClose, ...props }) => {
  const colors = useTheme();
  const [playbackInfo,] = useState({});
  const [controlAPI,] = useState({});
  const [showPlaylists, setShowPlaylists] = useState(false);
  useEffect(() => {
    setPlayer('jooki');
    return () => setPlayer(null);
  }, [setPlayer]);
  if (showPlaylists) {
    return (
      <Playlists
        db={device.state.db}
        controlAPI={controlAPI}
        onClose={() => setShowPlaylists(false)}
        {...props}
      />
    );
  }
  return (
    <div className="jooki device">
      <ScreenHeader
        name="Jooki"
        prev="Library"
        onClose={onClose}
      />
      <div className="content">
        <div className="header">
          <JookiControls playbackInfo={playbackInfo} controlAPI={controlAPI} center={true} />
          <div
            className="item"
            onClick={() => setShowPlaylists(true)}
          >
            <Icon name="playlists" size={36} />
            <div className="title">Playlists</div>
          </div>
          <DeviceInfo state={device.state} />
        </div>
        <Calendar wide={false} />
        <TokenList />

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
        .device :global(.item) {
          display: flex;
          padding: 9px 0.5em 0px 0.5em;
          box-sizing: border-box;
        }
        .device :global(.item .title) {
          flex: 10;
          font-size: 18px;
          line-height: 36px;
          padding-left: 0.5em;
        }
      `}</style>
    </div>
  );
};
