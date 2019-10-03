import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Label } from './Label';
import { API } from '../../../lib/api';

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
  const [, connectDragSource] = useDrag({
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
          const api = new API(() => console.error("login required"));
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
        onRename={name => onRename(playlist, name)}
        onSelect={() => onSelect(playlist)}
      />
    </div>
  ));
};
