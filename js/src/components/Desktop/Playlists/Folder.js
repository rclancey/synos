import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Label } from './Label';
import { Playlist } from './Playlist';

export const Folder = ({
  device,
  playlist,
  depth = 0,
  indentPixels = 1,
  icon,
  name,
  selected,
  onSelect,
  onRename,
  onMovePlaylist,
  onAddToPlaylist,
  controlAPI,
}) => {
  const [, connectDragSource] = useDrag({
    item: {
      type: 'Folder',
      device,
      playlist,
    },
  });
  const [dropCollect, connectDropTarget] = useDrop({
    accept: ['Folder', 'Playlist'],
    drop(item, monitor) {
      if (!!onMovePlaylist) {
        onMovePlaylist({
          source: item,
          target: { device, playlist },
        });
      }
    },
    canDrop(item, monitor) {
      return !!onMovePlaylist;
    },
    collect(monitor, props) {
      return {
        isOver: monitor.isOver(),
        isOverShallow: monitor.isOver({ shallow: true }),
      };
    },
  });
  const [open, setOpen] = useState(false);
  return connectDropTarget(connectDragSource(
    <div className="folder">
      <Label
        depth={depth}
        indentPixels={indentPixels}
        icon={icon || 'folder'}
        name={name}
        folder={true}
        open={open || (false && dropCollect.isOver)}
        highlight={dropCollect.isOverShallow}
        selected={selected === playlist.persistent_id}
        onToggle={() => setOpen(cur => !cur)}
        onRename={name => onRename(playlist, name)}
        onSelect={() => onSelect(playlist)}
      />
      { (open || (false && dropCollect.isOver)) && playlist.children ? (
        <div className="folderContents">
          { playlist.children.map(child => child.folder ? (
            <Folder
              device={device}
              playlist={child}
              depth={depth+1}
              indentPixels={indentPixels}
              icon={child.icon}
              name={child.name}
              selected={selected}
              onSelect={onSelect}
              onRename={onRename}
              onMovePlaylist={onMovePlaylist}
              onAddToPlaylist={onAddToPlaylist}
              controlAPI={controlAPI}
            />
          ) : (
            <Playlist
              device={device}
              playlist={child}
              depth={depth+1}
              indentPixels={indentPixels}
              icon={child.icon}
              name={child.name}
              selected={selected}
              onSelect={onSelect}
              onRename={onRename}
              onAddToPlaylist={onAddToPlaylist}
              controlAPI={controlAPI}
            />
          )) }
        </div>
      ) : null }
    </div>
  ));
};