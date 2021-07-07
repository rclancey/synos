import React, { useState, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { Dialog, ButtonRow, Button, Padding } from '../Dialog';
import { SmartPlaylistEditor } from './SmartPlaylistEditor';
import { useTheme } from '../../../lib/theme';

export const EditPlaylist = ({
  playlist,
  onSavePlaylist,
  onCancel,
}) => {
  const colors = useTheme();
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

