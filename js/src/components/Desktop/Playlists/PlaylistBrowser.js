import React, { useState, useEffect, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";
import { useFocus } from '../../../lib/useFocus';
import { PLAYLIST_ORDER } from '../../../lib/distinguished_kinds';
import { Folder } from './Folder';
import { Playlist } from './Playlist';
import { Label } from './Label';
import { DevicePlaylists } from '../Device/Playlists';
import { CreatePlaylist } from './CreatePlaylist';
import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';

export const PlaylistBrowser = ({
  devices,
  playlists,
  selected,
  onSelect,
  onMovePlaylist,
  onAddToPlaylist,
  onCreatePlaylist,
  controlAPI,
  setPlayer,
}) => {
  const { focused, node, focus, onFocus, onBlur } = useFocus();

  useEffect(() => {
    const handler = event => {
      if (focused.current) {
        //console.debug('playlist browser got key press %o', event);
        if (event.metaKey) {
          if (event.code === 'KeyN') {
            event.stopPropagation();
            event.preventDefault();
            if (event.shiftKey) {
              console.debug('new folder');
            } else {
              console.debug('new playlist');
            }
          }
        }
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, [focused]);

  const wrappedOnSelect = useCallback((pl) => {
    focus();
    onSelect(pl);
  }, [focus, onSelect]);

  const onRename = useCallback((pl, name) => {
    console.debug('rename playlist %o to %o', pl, name);
  }, []);

  const [newPlaylistDialog, setNewPlaylistDialog] = useState(false);
  const api = useAPI(API);

  return (
    <div
      ref={node}
      tabIndex={10}
      className="playlistBrowser"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      { newPlaylistDialog ? (
        <CreatePlaylist
          onCreatePlaylist={(pl) => {
            api.createPlaylist(pl);
            setNewPlaylistDialog(false);
          }}
          onCancel={() => setNewPlaylistDialog(false)}
        />
      ) : null }
      <h1>Library</h1>
      <div className="groups">
        <Label
          icon="songs"
          name="Everything"
          selected={selected === null}
          folder={false}
          onSelect={() => wrappedOnSelect(null)}
        />
        <Label
          icon="recent"
          name="Recently Added"
          selected={selected === 'recent'}
          folder={false}
          onSelect={() => wrappedOnSelect({ persistent_id: 'recent' })}
        />
        <Label
          icon="artists"
          name="Artists"
          selected={selected === 'artists'}
          folder={false}
          onSelect={() => wrappedOnSelect({ persistent_id: 'artists' })}
        />
        <Label
          icon="albums"
          name="Albums"
          selected={selected === 'albums'}
          folder={false}
          onSelect={() => wrappedOnSelect({ persistent_id: 'albums' })}
        />
        { playlists.filter(pl => {
            const o = PLAYLIST_ORDER[pl.kind];
            if (o === null || o === undefined || o < 0 || o >= 100) {
              return false;
            }
            return true;
          }).map(pl => (
            <Label
              key={pl.persistent_id}
              icon={pl.kind}
              name={pl.name}
              selected={selected === pl.persistent_id}
              folder={false}
              onSelect={() => wrappedOnSelect(pl)}
            />
          )) }
      </div>
      <DevicePlaylists
        devices={devices}
        selected={selected}
        onSelect={onSelect}
        setPlayer={setPlayer}
      />
      <div className="split">
        <h1>Music Playlists</h1>
        <h1 className="new" onClick={() => setNewPlaylistDialog(true)}>New...</h1>
      </div>
      { playlists.filter(pl => {
          const o = PLAYLIST_ORDER[pl.kind];
          if (o === null || o === undefined || o < 100) {
            return false;
          }
          return true;
        }).map(pl => pl.folder ? (
          <Folder
            key={pl.persistent_id}
            device="itunes"
            playlist={pl}
            depth={0}
            indentPixels={12}
            icon="folder"
            name={pl.name}
            selected={selected}
            onSelect={wrappedOnSelect}
            onRename={onRename}
            onMovePlaylist={onMovePlaylist}
            onAddToPlaylist={onAddToPlaylist}
            controlAPI={controlAPI}
          />
        ) : (
          <Playlist
            key={pl.persistent_id}
            device="itunes"
            playlist={pl}
            depth={0}
            indentPixels={12}
            icon={pl.icon}
            name={pl.name}
            selected={selected}
            onSelect={wrappedOnSelect}
            onRename={onRename}
            onAddToPlaylist={onAddToPlaylist}
          />
        )) }
      <style jsx>{`
        .playlistBrowser {
          flex: 1;
          min-width: 200px;
          max-width: 200px;
          font-size: 13px;
          height: 100%;
          overflow: auto;
          background-color: var(--dark);
          color: var(--text);
          border-right: solid var(--border) 1px;
        }
        .playlistBrowser:focus {
          outline: none;
        }
        .playlistBrowser :global(.icon), .playlistBrowser :global(.svgIcon) {
          margin-left: 25px;
          margin-right: 0.25em;
        }
        .playlistBrowser :global(h1) {
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
          margin-bottom: 10px;
          margin-left: 1em;
        }
        .playlistBrowser :global(.selected) {
          background-color: var(--dark);
        }
        .playlistBrowser:focus-within :global(.selected) {
          background-color: var(--highlight);
          color: var(--inverse);
        }
        .playlistBrowser :global(.folder>.label.dropTarget) {
          background-color: yellow;
          color: black;
        }
        .playlistBrowser :global(.playlist>.label.dropTarget) {
          background-color: orange;
          color: black;
        }
        .playlistBrowser .split {
          display: flex;
          flex-direction: row;
        }
        .playlistBrowser .split .new {
          flex: 2;
          margin-right: 1em;
          text-align: right;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
