import React, { useState, useRef, useEffect } from 'react';
import { PLAYLIST_ORDER } from '../../../lib/distinguished_kinds';
import { Folder } from './Folder';
import { Playlist } from './Playlist';
import { Label } from './Label';
import { DevicePlaylists } from '../Device/Playlists';
import { useTheme } from '../../../lib/theme';

export const PlaylistBrowser = ({
  devices,
  playlists,
  selected,
  onSelect,
  onMovePlaylist,
  onAddToPlaylist,
  controlAPI,
}) => {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);
  const focusRef = useRef(focused);
  const node = useRef(null);
  useEffect(() => {
    focusRef.current = focused;
  }, [focused]);
  useEffect(() => {
    const handler = event => {
      if (focusRef.current) {
        console.debug('playlist browser got key press %o', event);
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
  }, []);
  const wrappedOnSelect = pl => {
    if (node.current) {
      node.current.focus();
    }
    onSelect(pl);
  };
  const onRename = (pl, name) => {
    console.debug('rename playlist %o to %o', pl, name);
  };

  return (
    <div
      ref={n => node.current = n || node.current}
      tabIndex={10}
      className="playlistBrowser"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <h1>Library</h1>
      <div className="groups">
        <Label
          icon="songs"
          name="Everything"
          selected={selected === null}
          folder={false}
          onSelect={() => wrappedOnSelect(null)}
        />
        { playlists.filter(pl => {
            const o = PLAYLIST_ORDER[pl.kind];
            if (o === null || o === undefined || o < 0 || o >= 100) {
              return false;
            }
            return true;
          }).map(pl => (
            <Label
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
      />
      <h1>Music Playlists</h1>
      { playlists.filter(pl => {
          const o = PLAYLIST_ORDER[pl.kind];
          if (o === null || o === undefined || o >= 100) {
            return true;
          }
          return false;
        }).map(pl => pl.folder ? (
          <Folder
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
          background-color: ${colors.panelBackground};
          color: ${colors.panelText};
        }
        .playlistBrowser:focus {
          outline: none;
        }
        .playlistBrowser :global(.icon) {
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
          background-color: ${colors.blurHighlight};
        }
        .playlistBrowser:focus-within :global(.selected) {
          background-color: ${colors.highlightText};
          color: ${colors.highlightInverse};
        }
        .playlistBrowser :global(.folder>.label.dropTarget) {
          background-color: ${colors.dropTarget.folderBackground};
          color: ${colors.dropTarget.folderText};
        }
        .playlistBrowser :global(.playlist>.label.dropTarget) {
          background-color: ${colors.dropTarget.playlistBackground} !important;
          color: ${colors.dropTarget.playlistText} !important;
        }
      `}</style>
    </div>
  );
};
