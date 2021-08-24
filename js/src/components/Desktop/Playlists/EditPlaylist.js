import React, { useState, useEffect, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { Dialog, ButtonRow, Padding } from '../Dialog';
import Button from '../../Input/Button';
import { SmartPlaylistEditor } from './SmartPlaylistEditor';

export const EditPlaylist = ({
  playlist,
  onSavePlaylist,
  onCancel,
}) => {
  const [smart, setSmart] = useState(playlist.smart);
  const onSave = useCallback(() => onSavePlaylist({...playlist, smart }), [playlist, smart, onSavePlaylist]);
  useEffect(() => {
    setSmart(playlist.smart);
  }, [playlist]);
  return (
    <Dialog title={playlist.name} onDismiss={onCancel}>
      <div className="content">
        <SmartPlaylistEditor {...smart} onChange={setSmart} />
        <ButtonRow>
          <Padding />
          <Button type="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
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

