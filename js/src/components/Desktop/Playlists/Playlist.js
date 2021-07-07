import React, { useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useAPI } from '../../../lib/useAPI';
import { API } from '../../../lib/api';
import { Label } from './Label';

export const Playlist = ({
  device,
  playlist,
  depth = 0,
  indentPixels = 1,
  icon,
  name,
  selected,
  onSelect,
  onRename,
  onAddToPlaylist,
  controlAPI,
}) => {
  const api = useAPI(API);
  const [, connectDragSource] = useDrag({
    type: 'Playlist',
    item: {
      type: 'Playlist',
      device,
      playlist,
    },
  });
  const [dropCollect, connectDropTarget] = useDrop({
    accept: ['TrackList'],
    drop(item, monitor) {
      if (onAddToPlaylist) {
        onAddToPlaylist({
          source: item,
          target: { device, playlist },
        });
      }
    },
    canDrop(item, monitor) {
      return !!onAddToPlaylist;
    },
    collect(monitor, props) {
      return {
        isOver: monitor.isOver(),
      };
    },
  });
  const onRenameCallback = useCallback(name => onRename(playlist, name), [onRename, playlist]);
  const onSelectCallback = useCallback(() => onSelect(playlist), [onSelect, playlist]);

  return connectDropTarget(connectDragSource(
    <div
      className="folder"
      onDoubleClick={evt => {
        evt.preventDefault();
        evt.stopPropagation();
        onSelect(playlist);
        if (controlAPI.onSetPlaylist) {
          controlAPI.setPlaylist(playlist, 0);
        } else if (controlAPI.onReplaceQueue) {
          api.loadPlaylistTracks(playlist)
            .then(tracks => controlAPI.onReplaceQueue(tracks));
        }
      }}
    >
      <Label
        depth={depth}
        indentPixels={indentPixels}
        icon={icon || playlist.kind || 'standard'}
        name={name}
        highlight={dropCollect.isOver}
        selected={selected === playlist.persistent_id}
        folder={false}
        onRename={onRenameCallback}
        onSelect={onSelectCallback}
      />
    </div>
  ));
};
