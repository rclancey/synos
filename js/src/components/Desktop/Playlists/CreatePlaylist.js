import React, { useState } from 'react';
import _JSXStyle from "styled-jsx/style";
import { Dialog, ButtonRow, Button, Padding } from '../Dialog';
import { SmartPlaylistEditor } from './SmartPlaylistEditor';
import { useTheme } from '../../../lib/theme';

export const CreatePlaylist = ({
  parentId,
  onCreatePlaylist,
  onCancel,
}) => {
  const colors = useTheme();
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
  return (
    <Dialog title="Create Playlist..." style={{minWidth: '400px'}} onDismiss={onCancel}>
      <div className="content">
        <div className="kind">
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
          Name: <input type="text" value={name} onChange={evt => { setName(evt.target.value); setNameUpdated(true); }} />
        </div>
        { kind === 'smart' ? (<SmartPlaylistEditor {...smart} onChange={setSmart} />) : null }
        <ButtonRow>
          <Padding />
          <Button
            label="Cancel"
            onClick={onCancel}
          />
          <Button
            label="Create"
            highlight={true}
            onClick={() => {
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
            }}
          />
        </ButtonRow>
        <style jsx>{`
          .content>.kind, .content>.name, .content :global(.smartEditor) {
            margin-bottom: 1em;
          }
          .content :global(select),
          .content :global(input) {
            color: ${colors.input};
            background-color: ${colors.inputBackground};
          }
          .content :global(input[type="text"]),
          .content :global(input[type="number"]),
          .content :global(input[type="date"]) {
            border: solid ${colors.text} 1px;
            border-radius: 3px;
          }
        `}</style>
      </div>
    </Dialog>
  );
};
