import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrackMenu, PlaylistMenu } from './TrackMenu';
import { NowPlaying } from './NowPlaying';
import { Icon } from '../Icon';
import { Home } from './Home';
import { useTheme } from '../../lib/theme';

export const MobileSkin = ({
  theme,
  player,
  setPlayer,
  playbackInfo,
  controlAPI,
}) => {
  const colors = useTheme();
  const [children, setChildren] = useState(null);
  const [trackMenuTrack, setTrackMenuTrack] = useState(null);
  const [playlistMenuTracks, setPlaylistMenuTracks] = useState(null);
  const [playlistMenuTitle, setPlaylistMenuTitle] = useState(null);

  const onOpen = setChildren;
  const onClose = useMemo(() => {
    return () => setChildren(null);
  }, [setChildren]);
  const onTrackMenu = setTrackMenuTrack;
  const onPlaylistMenu = useMemo(() => {
    return (title, tracks) => {
      setPlaylistMenuTitle(title);
      setPlaylistMenuTracks(tracks);
    };
  }, [setPlaylistMenuTitle, setPlaylistMenuTracks]);
  const onEnableSonos = useMemo(() => {
    return () => setPlayer('sonos');
  }, [setPlayer]);
  const onDisableSonos = useMemo(() => {
    return () => setPlayer('local');
  }, [setPlayer]);

  return (
    <div id="app" className={`mobile ${theme}`}>
      <Home
        controlAPI={controlAPI}
        onOpen={onOpen}
        onClose={onClose}
        onTrackMenu={onTrackMenu}
        onPlaylistMenu={onPlaylistMenu}
      >
        {children}
      </Home>
      <NowPlaying
        controlAPI={controlAPI}
        playbackInfo={playbackInfo}
        sonos={player === 'sonos'}
        onEnableSonos={onEnableSonos}
        onDisableSonos={onDisableSonos}
      />
      {trackMenuTrack ? (
        <PlaylistMenu
          tracks={[trackMenuTrack]}
          name={trackMenuTrack.name}
          onClose={() => setTrackMenuTrack(null)}
          controlAPI={controlAPI}
        />
      ) : null}
      {playlistMenuTracks ? (
        <PlaylistMenu
          name={playlistMenuTitle}
          tracks={playlistMenuTracks}
          onClose={() => setPlaylistMenuTracks(null)}
          controlAPI={controlAPI}
        />
      ) : null}
      <style jsx>{`
        #app {
          height: 100vh;
          background-color: ${colors.background};
          color: ${colors.text};
        }
      `}</style>
    </div>
  );
};

export default MobileSkin;
