import React, { useState, useCallback } from 'react';
import { PlaylistMenu } from './TrackMenu';
import { NowPlaying } from './NowPlaying';
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
  const onClose = useCallback(() => setChildren(null), [setChildren]);
  const onTrackMenu = setTrackMenuTrack;
  const onPlaylistMenu = useCallback((title, tracks) => {
    setPlaylistMenuTitle(title);
    setPlaylistMenuTracks(tracks);
  }, [setPlaylistMenuTitle, setPlaylistMenuTracks]);
  const onEnableSonos = useCallback(() => setPlayer('sonos'), [setPlayer]);
  const onDisableSonos = useCallback(() => setPlayer('local'), [setPlayer]);

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
