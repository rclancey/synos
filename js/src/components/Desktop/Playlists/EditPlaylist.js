import React, { useState, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { Dialog, ButtonRow, Button, Padding } from '../Dialog';
import { SmartPlaylistEditor } from './SmartPlaylistEditor';

export const EditPlaylist = ({
  playlist,
  onSavePlaylist,
  onCancel,
}) => {
  const [smart, setSmart] = useState(playlist.smart);
  useEffect(() => {
    setSmart(playlist.smart);
  }, [playlist]);
  return (
    <Dialog title={playlist.name} onDismiss={onCancel}>
      <div className="content">
        <SmartPlaylistEditor {...smart} onChange={setSmart} />
        <ButtonRow>
          <Padding />
          <Button
            label="Cancel"
            onClick={onCancel}
          />
          <Button
            label="Save"
            highlight={true}
            onClick={() => {
              onSavePlaylist(Object.assign({}, playlist, { smart }));
            }}
          />
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

