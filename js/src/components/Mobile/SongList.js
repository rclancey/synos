import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTheme } from '../../lib/theme';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { AutoSizeList } from '../AutoSizeList';
import { CoverArt } from '../CoverArt';
import { Icon } from '../Icon';
import { DotsMenu } from './TrackMenu';
import { MixCover } from './MixCover';
import { Back } from './ScreenHeader';
import { Sources } from './Sources';
import { SongRow } from './SongRow';

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
      return `${plural(hours, 'hour')}, ${plural(mins, 'minute')}`;
    }
    const days = Math.floor(durT / (60 * 24));
    const hours = Math.round((durT % (60 * 24)) / 60);
    return `${plural(days, 'day')}, ${plural(hours, 'hour')}`;
  }, [tracks]);
  return dur;
};

export const PlaylistTitle = ({
  playlist,
  tracks,
  editing = false,
  adding = false,
  onPlaylistMenu,
  onEditPlaylist,
}) => {
  const colors = useTheme();
  const dur = useDuration(tracks);
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
            onOpen={tracks => onPlaylistMenu(playlist.name, tracks)}
          />
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
        .title .buttons .edit {
          flex: 10;
          text-align: right;
          font-size: 18px;
          line-height: 30px;
          color: ${colors.highlightText};
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
  adding = false,
  onAdd,
  onUpdatePlaylist = () => {},
  children,
}) => {
  const colors = useTheme();
  const [chooser, setChooser] = useState(false);
  const [chooserSource, setChooserSource] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollTopRef = useRef(scrollTop);
  const ref = useRef(null);

  useEffect(() => {
    scrollTopRef.current = scrollTop;
  }, [scrollTop]);

  const onScroll = useCallback(({ scrollOffset }) => {
    setScrollTop(scrollOffset);
  }, [setScrollTop]);

  const onAddMe = useCallback((track) => {
    console.error("%o onAddMe(%o): %o", playlist, track, editing);
    if (editing) {
      api.addToPlaylist(playlist, [track])
        .then(onUpdatePlaylist);
    }
    return onAdd(track);
  }, [api, playlist, editing, onUpdatePlaylist, onAdd]);

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

  const rowRenderer = useCallback(({ index, style }) => {
    if (editing && index === 0) {
      return (
        <div
          className="item add"
          style={style}
          onClick={() => setChooser(true)}
        >
          <Icon name="add" size={36} />
          <div className="action">Add Music</div>
        </div>
      );
    }
    const track = editing ? tracks[index - 1] : tracks[index];
    return (
      <SongRow
        style={style}
        index={editing ? index - 1 : index}
        len={tracks.length}
        playlist={playlist}
        track={track}
        withTrackNum={withTrackNum}
        withCover={withCover}
        withArtist={withArtist}
        withAlbum={withAlbum}
        editing={editing}
        adding={adding}
        onTrackMenu={onTrackMenu}
        onAdd={onAddMe}
        onMove={onMove}
        onDelete={onDelete}
      />
    );
  }, [playlist, tracks, withTrackNum, withCover, withArtist, withAlbum, onTrackMenu, editing, adding, onDelete, onMove, onAddMe]);

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

  return (
    <div className={`songList ${editing ? 'editing' : ''}`}>
      <Back onClose={onClose}>{prev}</Back>
      <Header colors={colors}>
        {children}
      </Header>
      <div className="items">
        <AutoSizeList
          xref={ref}
          itemCount={tracks.length + (editing ? 1 : 0)}
          itemSize={63}
          offset={0}
          initialScrollOffset={scrollTop}
          onScroll={onScroll}
        >
          {rowRenderer}
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
          color: ${colors.highlightText};
        }
      `}</style>
    </div>
  );
};

export const Playlist = ({
  prev,
  playlist,
  adding = false,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
  onAdd,
}) => {
  const [tracks, setTracks] = useState([]);
  const [editing, setEditing] = useState(false);
  const api = useAPI(API);
  const plid = playlist.persistent_id;

  const onUpdatePlaylist = useCallback(() => {
    api.loadPlaylistTracks(playlist).then(setTracks);
  }, [api, playlist, setTracks]);

  useEffect(() => {
    api.loadPlaylistTracks({ persistent_id: plid }).then(setTracks);
  }, [api, plid]);

  return (
    <SongList
      api={api}
      prev={prev}
      tracks={tracks}
      playlist={playlist}
      withTrackNum={false}
      withCover={true}
      withArtist={true}
      withAlbum={false}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
      editing={editing}
      adding={adding}
      onAdd={onAdd}
      onUpdatePlaylist={onUpdatePlaylist}
    >
      <MixCover tracks={tracks} radius={5} />
      <PlaylistTitle
        tracks={tracks}
        playlist={playlist}
        editing={editing}
        adding={adding}
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
  const dur = useDuration(tracks);
  if (tracks.length === 0) {
    return null;
  }
  const first = tracks[0];
  return (
    <div className="title">
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
      { adding ? null : (
        <DotsMenu
          track={tracks}
          onOpen={tracks => onPlaylistMenu(first.album, tracks)}
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
        .title .album {
          flex: 1;
          font-size: 16pt;
          font-weight: bold;
        }
        .title .artist {
          flex: 1;
          font-size: 12pt;
        }
        .title .genre {
          flex: 10;
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
  onAdd,
}) => {
  const [tracks, setTracks] = useState([]);
  const api = useAPI(API);
  useEffect(() => {
    api.songIndex(album).then(setTracks);
  }, [api, album]);

  return (
    <SongList
      api={api}
      prev={prev.name}
      tracks={tracks}
      adding={adding}
      withTrackNum={true}
      withCover={false}
      withArtist={false}
      withAlbum={false}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
      onAdd={onAdd}
    >
      <CoverArt track={tracks[0]} size={140} radius={5} />
      <AlbumTitle tracks={tracks} adding={adding} onPlaylistMenu={onPlaylistMenu} />
    </SongList>
  );
};

const Header = React.memo(({ colors, children }) => (
  <div className="header">
    {children}
    <style jsx>{`
      .header {
        display: flex;
        flex-direction: row;
        padding: 0.5em;
        padding-top: 54px;
        background-color: ${colors.sectionBackground};
      }
    `}</style>
  </div>
));
