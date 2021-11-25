import React, { useMemo, useState, useCallback, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import {
  BrowserRouter as Router,
  Route,
  useRouteMatch,
  generatePath,
  useHistory,
} from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { PLAYLIST_ORDER } from '../../lib/distinguished_kinds';
import { AutoSizeList } from '../AutoSizeList';
import Link from './Link';
import { Playlist } from './SongList';
import { ScreenHeader } from './ScreenHeader';
import { SVGIcon } from '../SVGIcon';

import CassetteIcon from '../icons/Cassette';
import BrainIcon from '../icons/Brain';
import AtomIcon from '../icons/Atom';
import PlaylistFolderIcon from '../icons/PlaylistFolder';

export const PlaylistWrapper = ({ persistent_id }) => {
  return null;
};

const Icon = ({ name, size }) => {
  switch (name) {
    case 'folder':
      return <SVGIcon icn={PlaylistFolderIcon} size={size} />;
    case 'genius':
      return <SVGIcon icn={AtomIcon} size={size} />;
    case 'smart':
      return <SVGIcon icn={BrainIcon} size={size} />;
    default:
      return <SVGIcon icn={CassetteIcon} size={size} />;
  }
};

export const PlaylistContainer = () => {
  const match = useRouteMatch();
  //const base = useMemo(() => generatePath(match.path, match.params), [match]);
  const { playlistId: persistent_id } = (match.params || {})
  const [playlist, setPlaylist] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const api = useAPI(API);

  useEffect(() => {
    //console.debug('history.pushState');
    //window.history.pushState({ persistent_id }, 'playlist folder', `/${persistent_id}`);
    if (persistent_id) {
      api.loadPlaylist(persistent_id).then(setPlaylist);
    } else {
      setPlaylist({ name: 'Playlists', folder: true });
    }
  }, [api, persistent_id]);
  useEffect(() => {
    api.loadPlaylists(persistent_id)
      .then(playlists => {
        if (playlists === null) {
          setPlaylists(null);
        } else {
          setPlaylists(playlists.filter(pl => {
            const o = PLAYLIST_ORDER[pl.kind];
            if (o === null || o === undefined) {
              return true;
            }
            if (o >= 100) {
              return true;
            }
            return false;
          }));
        }
      });
  }, [api, persistent_id]);

  if (playlist === null || playlist === undefined) {
    return null;
  }
  if (!playlist.folder) {
    return (
      <Playlist playlist={playlist} />
    );
  }
  return (
    <PlaylistFolder folder={playlist} contents={playlists} />
  );
  /*
  return (
    <Router>
      <Route path={`${base}/:id`}>
        <PlaylistContainer />
      </Route>
      <Route exact path={base}>
        <PlaylistFolder path={base} folder={playlist} contents={playlists} />
      </Route>
    </Router>
  );
  */
};

export const PlaylistFolder = ({ folder, contents }) => {
  const api = useAPI(API);
  const onNewPlaylist = useCallback(() => {
    const playlist = {
      parent_persistent_id: folder.persistent_id,
      kind: 'standard',
      name: 'Untitled Playilst',
      track_ids: [],
    };
    console.debug('createPlaylist(%o)', playlist);
    api.createPlaylist(playlist)
      .then((pl) => {
        window.history.pushState({}, pl.name, `/playlists/${pl.persistent_id}`);
      });
  }, [api, folder]);

  const rowRenderer = useCallback(({ key, index, style }) => {
    if (index >= contents.length) {
      return (
        <div
          key="new"
          className="item addPlaylist"
          style={style}
          onClick={onNewPlaylist}
        >
          <Icon name="new-playlist" size={36} />
          <div className="title">New Playlist...</div>
        </div>
      );
    }
    const pl = contents[index];
    return (
      <div
        key={pl.persistent_id}
        style={style}
      >
        <Link title={pl.name} to={`/playlists/${pl.persistent_id}`} className="item">
          <Icon name={pl.kind} size={36} />
          <div className="title">{pl.name}</div>
        </Link>
      </div>
    );
  }, [contents, onNewPlaylist]);

  if (contents === null || contents === undefined) {
    return null;
  }
  return (
    <div className="playlistList">
      <ScreenHeader name={folder.name} />
      <div className="items">
        <AutoSizeList
          id={folder.persistent_id || 'allplaylists'}
          xkey={folder.persistent_id}
          itemCount={contents.length + 1}
          itemSize={45}
          offset={0}
        >
          {rowRenderer}
        </AutoSizeList>
      </div>
      <style jsx>{`
        .playlistList {
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          overflow: hidden;
        }
        .playlistList .items {
          height: calc(100vh - 185px);
        }
        .playlistList :global(.item) {
          display: flex;
          padding: 9px 0.5em 0px 0.5em;
          box-sizing: border-box;
        }
        .playlistList .item .icon {
          flex: 1;
          width: 36px;
          min-width: 36px;
          max-width: 36px;
          height: 36px;
          box-sizing: border-box;
          background-size: cover;
          opacity: 0.75;
        }
        .playlistList :global(.item .title) {
          flex: 10;
          font-size: 18px;
          line-height: 36px;
          padding-left: 0.5em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};
