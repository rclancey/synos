import React, { useState, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";

import { Dialog, ButtonRow, Padding } from '../Dialog';
import Button from '../../Input/Button';
import MenuInput from '../../Input/MenuInput';
import TextInput from '../../Input/TextInput';
import { SmartPlaylistEditor } from './SmartPlaylistEditor';

const playlistTypeOptions = [
  { value: 'standard', label: 'Regular Playlist' },
  { value: 'folder', label: 'Playlist Folder' },
  { value: 'smart', label: 'Smart Playlist' },
];

export const CreatePlaylist = ({
  parentId,
  onCreatePlaylist,
  onCancel,
}) => {
  const [kind, setKind] = useState("standard");
  const [name, setName] = useState("Untitled Playlist");
  const [nameUpdated, setNameUpdated] = useState(false);
  const [smart, setSmart] = useState({
    ruleset: {
      conjunction: 'AND',
      rules: [{
        type: 'string',
        ruleset: null,
        field: 'artist',
        sign: 'STRPOS',
        op: 'IS',
        strings: [''],
        ints: [0, 0, 0],
        times: [0, 0, 0],
        bool: null,
        media_kind: null,
        playlist: null,
      }]
    },
    limit: {
      items: 50,
      size: 1024 * 1024 * 1024,
      time: 12 * 60 * 60 * 1000,
      field: 'date_added',
      desc: true,
    },
  });
  const onCreate = useCallback(() => {
    const playlist = { kind, name };
    if (parentId) {
      playlist.parent_persistent_id = parentId;
    }
    if (kind === 'smart') {
      playlist.smart = smart;
    }
    if (kind === 'folder') {
      playlist.folder = true;
    }
    if (kind === 'standard') {
      playlist.track_ids = [];
    }
    onCreatePlaylist(playlist);
  }, [kind, name, smart, parentId, onCreatePlaylist]);
  return (
    <Dialog title="Create Playlist..." style={{minWidth: '400px'}} onDismiss={onCancel}>
      <div className="content">
        <div className="kind">
          <MenuInput
            options={playlistTypeOptions}
            onChange={(k) => {
              setKind(k);
              if (!nameUpdated) {
                if (k === 'folder') {
                  setName('Untitled Folder');
                } else {
                  setName('Untitled Playlist');
                }
              }
            }}
          />
          <select value={kind} onChange={evt => {
            const k = evt.target.options[evt.target.selectedIndex].value;
            setKind(k);
            if (!nameUpdated) {
              if (k === 'folder') {
                setName('Untitled Folder');
              } else {
                setName('Untitled Playlist');
              }
            }
          }}>
            <option value="standard">Regular Playlist</option>
            <option value="folder">Playlist Folder</option>
            <option value="smart">Smart Playlist</option>
          </select>
        </div>
        <div className="name">
          Name:
          <TextInput value={name} onChange={(value) => { setName(value); setNameUpdated(true); }} />
        </div>
        { kind === 'smart' ? (<SmartPlaylistEditor {...smart} onChange={setSmart} />) : null }
        <ButtonRow>
          <Padding />
          <Button type="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onCreate}>Create</Button>
        </ButtonRow>
        <style jsx>{`
          .content>.kind, .content>.name, .content :global(.smartEditor) {
            margin-bottom: 1em;
          }
        `}</style>
      </div>
    </Dialog>
  );
};
