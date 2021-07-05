import React, { useState, useContext, useCallback } from 'react';
import { useStack } from './Router/StackContext';
import { QueueInfo } from '../Queue';
import { MixCover } from '../MixCover';
import { AlbumList } from './AlbumList';
import { Album } from './SongList';
import { useTheme } from '../../lib/theme';

export const MenuContext = React.createContext({
  onTrackMenu: (track) => null,
  onPlaylistMenu: (title, tracks) => null,
});

export const useMenuContext = () => useContext(MenuContext);

export const useMenus = () => {
  const [trackMenuTrack, setTrackMenuTrack] = useState(null);
  const [playlistMenuTracks, setPlaylistMenuTracks] = useState(null);
  const [playlistMenuTitle, setPlaylistMenuTitle] = useState(null);
  const onTrackMenu = setTrackMenuTrack;
  const onPlaylistMenu = useCallback((title, tracks) => {
    setPlaylistMenuTitle(title);
    setPlaylistMenuTracks(tracks);
  }, [setPlaylistMenuTitle, setPlaylistMenuTracks]);
  return { onTrackMenu, onPlaylistMenu, trackMenuTrack, playlistMenuTitle, playlistMenuTracks };
};

const QueueButton = ({ title, onClick }) => (
  <div className="item" onClick={onClick}>
    <div className="title">{title}</div>
    <style jsx>{`
      .item {
        padding: 0;
      }
      .title {
        margin: 0;
        padding: 1em;
      }
    `}</style>
  </div>
);

const ArtistLink = ({ track, onClose }) => {
  const stack = useStack();
  const artist = {
    name: track.artist,
    sort: track.sort_artist,
  };
  return (
    <QueueButton
      title="Show Artist Page"
      onClick={() => {
        
        stack.onPush(artist.name, <AlbumList artist={artist} />);
        onClose();
      }}
    />
  );
};

const AlbumLink = ({ track, onClose }) => {
  const stack = useStack();
  const album = {
    artist: {
      sort: track.sort_album_artist || track.sort_artist,
    },
    sort: track.sort_album,
  };
  return (
    <QueueButton
      title="Show Album Page"
      onClick={() => {
        stack.onPush(track.album, <Album album={album} />);
        onClose();
      }}
    />
  );
};

const PlayNow = ({ tracks, controlAPI, onClose }) => (
  <QueueButton
    title="Play Now"
    onClick={() => {
      controlAPI.onInsertIntoQueue(tracks)
        .then(() => controlAPI.onSkipBy(1))
        .then(() => controlAPI.onPlay())
        .then(() => onClose());
    }}
  />
);

const PlayNext = ({ tracks, controlAPI, onClose }) => (
  <QueueButton
    title="Play Next"
    onClick={() => {
      controlAPI.onInsertIntoQueue(tracks)
        .then(() => onClose());
    }}
  />
);

const Append = ({ tracks, controlAPI, onClose }) => (
  <QueueButton
    title="Add to End of Queue"
    onClick={() => {
      controlAPI.onAppendToQueue(tracks)
        .then(() => onClose());
    }}
  />
);

const Replace = ({ tracks, controlAPI, onClose }) => (
  <QueueButton
    title="Replace Queue"
    onClick={() => {
      controlAPI.onReplaceQueue(tracks)
        .then(() => onClose());
    }}
  />
);

const Header = ({ tracks, name }) => (
  <div className="header">
    <MixCover tracks={tracks} size={67} />
    <div className="title">
      <div className="name">{name}</div>
      { tracks.length === 1 ? (
        <div className="album">
          {tracks[0].artist}{'\u00a0\u2219\u00a0'}{tracks[0].album}
        </div>
      ) : (
        <QueueInfo tracks={tracks} />
      ) }
    </div>
    <style jsx>{`
      .header {
        display: flex;
        padding: 0.5em;
        border-bottom: solid #777 1px;
        background-color: transparent;
      }
      .header .title {
        margin-left: 0.5em;
      }
      .header .title .name {
        font-size: 12pt;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .header .title .album, .header .title :global(.queueInfo) {
        font-size: 10pt;
        font-weight: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #999;
      }
    `}</style>
  </div>
);

const QueueActions = ({ tracks, controlAPI, onClose }) => {
  const colors = useTheme();
  return (
    <div>
      <div className="items">
        <PlayNow tracks={tracks} controlAPI={controlAPI} onClose={onClose} />
        <PlayNext tracks={tracks} controlAPI={controlAPI} onClose={onClose} />
        <Append tracks={tracks} controlAPI={controlAPI} onClose={onClose} />
        <Replace tracks={tracks} controlAPI={controlAPI} onClose={onClose} />
      </div>
      <style jsx>{`
        .items {
          height: auto;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

const CloseButton = ({ onClose }) => {
  const colors = useTheme();
  return (
    <div className="cancel" onClick={onClose}>
      Cancel
      <style jsx>{`
        .cancel {
          padding: 1.5em;
          text-align: center;
          font-weight: bold;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export const PlaylistMenu = ({
  name,
  tracks,
  onClose,
  controlAPI,
}) => {
  const colors = useTheme();
  return (
    <div className="disabler">
      <div className="playlistMenu">
        <Header tracks={tracks} name={name} />
        <QueueActions tracks={tracks} controlAPI={controlAPI} onClose={onClose} />
        <CloseButton onClose={onClose} />
      </div>
      <style jsx>{`
        .disabler {
          position: fixed;
          z-index: 2;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          background-color: var(--blur-background);
          backdrop-filter: blur(0.7px);
        }
        .playlistMenu {
          position: fixed;
          z-index: 2;
          left: 20px;
          bottom: 75px;
          width: calc(100vw - 40px);
          border-radius: 20px;
          max-height: 60vh;
          background: var(--gradient);
        }

      `}</style>
    </div>
  );
};

export const TrackMenu = ({
  track,
  onClose,
  controlAPI,
}) => {
  const colors = useTheme();
  return (
    <div className="disabler">
      <div className="trackMenu">
        <Header tracks={[track]} name={track.name} />
        <div className="items">
          <ArtistLink track={track} onClose={onClose} />
          <AlbumLink track={track} onClose={onClose} />
          <PlayNow tracks={[track]} controlAPI={controlAPI} onClose={onClose} />
          <PlayNext tracks={[track]} controlAPI={controlAPI} onClose={onClose} />
          <Append tracks={[track]} controlAPI={controlAPI} onClose={onClose} />
          <Replace tracks={[track]} controlAPI={controlAPI} onClose={onClose} />
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <style jsx>{`
        .header {
          display: flex;
        }
        .disabler {
          position: fixed;
          z-index: 2;
          left: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          background-color: ${colors.disabler};
        }
        .trackMenu {
          position: fixed;
          z-index: 2;
          left: 20px;
          bottom: 75px;
          width: calc(100vw - 40px);
          border: solid transparent 1px;
          border-radius: 20px;
          max-height: 70vh;
          background-color: ${colors.background};
        }
        .items {
          height: auto;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export const DotsMenu = ({ track, onOpen }) => {
  const colors = useTheme();
  return (
    <div
      className={`dotsmenu ${Array.isArray(track) ? 'list' : ''}`}
      onClick={() => onOpen(track)}
    >
      {'\u2219\u2219\u2219'}
      <style jsx>{`
        .dotsmenu {
          flex: 1;
          padding-top: 12px;
        }
        .dotsmenu.list {
          border: solid transparent 1px;
          border-radius: 50%;
          box-sizing: border-box;
          width: 30px;
          height: 30px;
          min-height: 30px;
          max-height: 30px;
          font-size: 12px;
          padding-top: 6px;
          text-align: center;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};
