import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { useStack } from './Router/StackContext';
import { useMenuContext } from './TrackMenu';
import { AutoSizeList } from '../AutoSizeList';
import { CoverArt } from '../CoverArt';
import { DotsMenu } from './TrackMenu';
import { MixCover } from '../MixCover';
import { Sources } from './Sources';
import { SongRow } from './SongRow';
import { Home } from './Home';
import ShareIcon from '../icons/Share';
import UnshareIcon from '../icons/Unshare';

const plural = (n, s) => {
  if (n === 1) {
    return `${n} ${s}`;
  }
  return `${n} ${s}s`;
};

const useDuration = (tracks) => {
  const dur = useMemo(() => {
    const durT = tracks.reduce((sum, val) => sum + val.total_time, 0) / 60000;
    if (durT < 59.5) {
      return plural(Math.round(durT), 'minute');
    }
    if (durT < 60 * 24) {
      const hours = Math.floor(durT / 60);
      const mins = Math.round(durT) % 60;
      return `${hours}:${mins < 10 ? '0' : ''}${mins}`;
      //return `${plural(hours, 'hour')}, ${plural(mins, 'minute')}`;
    }
    const days = Math.floor(durT / (60 * 24));
    const hours = Math.round((durT % (60 * 24)) / 60);
    return `${plural(days, 'day')}, ${plural(hours, 'hour')}`;
  }, [tracks]);
  return dur;
};

const Share = ({ shared, onToggle }) => (
  <div className="share" onClick={onToggle}>
    { shared ? <ShareIcon /> : <UnshareIcon /> }
    <style jsx>{`
      .share {
        width: 24px;
        height: 24px;
        margin-left: 20px;
        color: var(--highlight);
      }
      .share :global(svg) {
        width: 24px;
        height: 24px;
      }
    `}</style>
  </div>
);

export const PlaylistTitle = ({
  playlist,
  tracks,
  editing = false,
  adding = false,
  onPlaylistMenu,
  onEditPlaylist,
}) => {
  const api = useAPI(API);
  const menu = useMenuContext();
  const dur = useDuration(tracks);
  const [shared, setShared] = useState(playlist.shared);
  useEffect(() => setShared(playlist.shared), [playlist]);
  const onToggleShare = useCallback(() => {
    if (shared) {
      api.unsharePlaylist(playlist.persistent_id).then(() => setShared(false));
    } else {
      api.sharePlaylist(playlist.persistent_id).then(() => setShared(true));
    }
  }, [api, playlist, shared]);
  return (
    <div className="title">
      <div className="album">{playlist.name}</div>
      <div className="genre">
        {plural(tracks.length, 'Track')}
        {`\u00a0\u2219\u00a0${dur}`}
      </div>
      { adding ? null : (
        <div className="buttons">
          <DotsMenu
            track={tracks}
            onOpen={tracks => menu.onPlaylistMenu(playlist.name, tracks)}
          />
          <Share shared={shared} onToggle={onToggleShare} />
          <div className="spacer" />
          <div className="edit" onClick={() => onEditPlaylist(!editing)}>{editing ? "Done" : "Edit"}</div>
        </div>
      ) }
      <style jsx>{`
        .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          flex: 10;
          display: flex;
          flex-direction: column;
          font-weight: normal;
          margin-top: 0;
        }
        .title .album {
          flex: 1;
          font-size: 16pt;
          font-weight: bold;
        }
        .title .genre {
          flex: 10;
          font-size: 12pt;
        }
        .title .buttons {
          display: flex;
          flex-direction: row;
          width: 100%;
        }
        .title .buttons .spacer {
          flex: 10;
        }
        .title .buttons .edit {
          flex: 1;
          padding-left: 1em;
          text-align: right;
          font-size: 18px;
          line-height: 30px;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export const SongList = ({
  api,
  prev,
  playlist,
  tracks,
  withTrackNum = false,
  withCover = false,
  withArtist = false,
  withAlbum = false,
  onClose,
  onTrackMenu,
  editing = false,
  onBeginAdd,
  onUpdatePlaylist = () => {},
  children,
}) => {
  const stack = useStack();
  const menu = useMenuContext();
  const [chooser, setChooser] = useState(false);
  const [chooserSource, setChooserSource] = useState(null);
  const page = stack.pages[stack.pages.length - 1];
  const scrollTop = page ? page.scrollOffset : 0;
  const scrollTopRef = useRef(scrollTop);
  const ref = useRef(null);

  useEffect(() => {
    scrollTopRef.current = scrollTop;
  }, [scrollTop]);

  /*
  const onAddMe = useCallback((track) => {
    console.error("%o onAddMe(%o): %o", playlist, track, editing);
    if (editing) {
      api.addToPlaylist(playlist, [track])
        .then(onUpdatePlaylist);
    }
    return onAdd(track);
  }, [api, playlist, editing, onUpdatePlaylist, onAdd]);
  */

  const onDelete = useCallback((track, index) => {
    return api.deletePlaylistTracks(
      { ...playlist, tracks, items: tracks },
      [{ track: { origIndex: index } }]
    )
      .then(onUpdatePlaylist);
  }, [playlist, tracks, api, onUpdatePlaylist]);

  const onMove = useCallback((srcIndex, dstIndex, dir) => {
    console.debug('move track %o to %o in %o', srcIndex, dstIndex, playlist);
    api.reorderTracks({ ...playlist, tracks, items: tracks }, dstIndex, [srcIndex])
      .then(onUpdatePlaylist)
      .then(() => {
        if (ref.current) {
          ref.current.scrollTo(scrollTopRef.current + dir * 63);
        }
      });
  }, [playlist, tracks, api, onUpdatePlaylist]);

  const itemData = useMemo(() => {
    return {
      tracks,
      offset: editing ? -1 : 0,
      len: tracks.length,
      playlist,
      withTrackNum,
      withCover,
      withArtist,
      withAlbum,
      editing,
      onTrackMenu: menu.onTrackMenu,
      onBeginAdd: onBeginAdd,
      onAdd: stack.onAdd,
      onMove,
      onDelete,
    };
  }, [tracks, playlist, withTrackNum, withCover, withArtist, withAlbum, menu, onMove, onDelete]);

  /*
  if (chooser) {
    return (
      <Sources
        prev={`Edit ${playlist ? playlist.name : 'Playlist'}`}
        onOpen={setChooserSource}
        adding={true}
        onAdd={onAddMe}
        onClose={() => setChooserSource(null)}
        onFinish={() => setChooser(false)}
      >
        {chooserSource}
      </Sources>
    );
  }
  */

  return (
    <div className={`songList ${editing ? 'editing' : ''}`}>
      <Header>
        {children}
      </Header>
      <div className="items">
        <AutoSizeList
          xref={ref}
          itemData={itemData}
          itemCount={tracks.length + (editing ? 1 : 0)}
          itemSize={63}
          offset={0}
          initialScrollOffset={scrollTop}
          onScroll={stack.onScroll}
        >
          {SongRow}
        </AutoSizeList>
      </div>

      <style jsx>{`
        .songList {
          width: 100vw;
          height: calc(100vh - 69px);
          box-sizing: border-box;
          overflow: hidden;
        }
        .songList .items {
          position: absolute;
          left: 0;
          top: 204px;
          width: 100vw;
          height: calc(100vh - 273px);
        }
        .songList :global(.item.add) {
          display: flex;
          padding: 9px 9px 0px 9px;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }
        .songList :global(.action) {
          line-height: 44px;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export const Playlist = ({
  playlist,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
}) => {
  const stack = useStack();
  const setTitle = stack.setTitle;
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (editing) {
      setTitle(`Edit ${playlist.name}...`);
    } else {
      setTitle(playlist.name);
    }
  }, [setTitle, playlist, editing]);
  const onBeginEdit = useCallback(() => {
    setEditing(true);
  }, []);
  const onFinishAddX = stack.onFinishAdd;
  const onFinishEdit = useCallback(() => {
    onFinishAddX();
    setEditing(false);
  }, [onFinishAddX]);
  const onBeginAddX = stack.onBeginAdd;
  const onBeginAddY = useCallback(() => {
    onBeginAddX(playlist, 'Library', <Home />);
  }, [onBeginAddX, playlist]);
  const [tracks, setTracks] = useState(null);
  const api = useAPI(API);
  const plid = playlist.persistent_id;

  const onUpdatePlaylist = useCallback(() => {
    api.loadPlaylistTracks(playlist).then(setTracks);
  }, [api, playlist, setTracks]);

  useEffect(() => {
    api.loadPlaylistTracks({ persistent_id: plid }).then(setTracks);
  }, [api, plid]);

  if (tracks === null) {
    return null;
  }

  return (
    <SongList
      api={api}
      tracks={tracks}
      playlist={playlist}
      withTrackNum={false}
      withCover={true}
      withArtist={true}
      withAlbum={true}
      editing={editing}
      onBeginAdd={editing ? onBeginAddY : null}
      onUpdatePlaylist={onUpdatePlaylist}
    >
      <MixCover tracks={tracks} radius={5} />
      <PlaylistTitle
        tracks={tracks}
        playlist={playlist}
        editing={editing}
        onPlaylistMenu={onPlaylistMenu}
        onEditPlaylist={setEditing}
      />
    </SongList>
  );
};

const AlbumTitle = React.memo(({
  tracks,
  adding,
  onPlaylistMenu,
}) => {
  const menu = useMenuContext();
  const dur = useDuration(tracks);
  if (tracks.length === 0) {
    return null;
  }
  const first = tracks[0];
  return (
    <div className="title">
      <div className="info">
        <div className="album">{first.album}</div>
        <div className="artist">{first.album_artist || first.artist}</div>
        <div className="genre">
          {first.genre}
          {first.year ? `\u00a0\u2219\u00a0${first.year}` : ''}
        </div>
        <div className="genre">
          {plural(tracks.length, 'Track')}
          {`\u00a0\u2219\u00a0${dur}`}
        </div>
      </div>
      { adding ? null : (
        <DotsMenu
          track={tracks}
          onOpen={tracks => menu.onPlaylistMenu(first.album, tracks)}
        />
      ) }
      <style jsx>{`
        .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          flex: 10;
          display: flex;
          flex-direction: column;
          font-weight: normal;
          margin-top: 0;
        }
        .title .info {
          flex: 10;
        }
        .title .album, .title .artist {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        .title .album {
          font-size: 16pt;
          font-weight: bold;
        }
        .title .artist {
          font-size: 12pt;
        }
        .title .genre {
          font-size: 12pt;
        }
      `}</style>
    </div>
  );
});

export const Album = ({
  prev,
  album,
  adding,
  onTrackMenu,
  onPlaylistMenu,
  onClose,
}) => {
  const [tracks, setTracks] = useState(null);
  const api = useAPI(API);
  useEffect(() => {
    if (album.tracks) {
      setTracks(album.tracks);
    } else {
      api.songIndex(album).then(setTracks);
    }
  }, [api, album]);

  if (tracks === null) {
    return null;
  }

  return (
    <SongList
      api={api}
      prev={prev ? prev.name : 'blah'}
      tracks={tracks}
      adding={adding}
      withTrackNum={true}
      withCover={false}
      withArtist={false}
      withAlbum={false}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
    >
      <CoverArt track={tracks[0]} size={140} radius={5} />
      <AlbumTitle tracks={tracks} adding={adding} onPlaylistMenu={onPlaylistMenu} />
    </SongList>
  );
};

const Header = React.memo(({ children }) => (
  <div className="header">
    {children}
    <style jsx>{`
      .header {
        display: flex;
        flex-direction: row;
        padding: 0.5em;
        padding-top: 54px;
        background-color: var(--contrast4);
      }
    `}</style>
  </div>
));
