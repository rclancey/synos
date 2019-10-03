import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const TrackRow = ({
  device,
  selected,
  playlist,
  index,
  rowData,
  className,
  style,
  columns,
  onReorder,
  onClick,
  onPlay,
}) => {
  const aria = {
    'aria-label': 'row',
    'aria-rowindex': index,
  };
  const [, connectDragSource] = useDrag({
    item: {
      type: 'TrackList',
      device,
      playlist,
      tracks: selected,
    },
    isDragging(monitor) {
      return selected.some(tr => tr.track.origIndex === rowData.origIndex);
    },
  });
  const [dropCollect, connectDropTarget] = useDrop({
    accept: ['TrackList'],
    drop(item, monitor) {
      if (onReorder) {
        onReorder(playlist, index + 1, item.tracks.map(t => t.index));
      }
    },
    canDrop(item, monitor) {
      if (!onReorder) {
        return false;
      }
      if (!playlist) {
        return false;
      }
      if (!item.playlist || item.playlist.persistent_id !== playlist.persistent_id) {
        return false;
      }
      return true;
    },
    collect(monitor, props) {
      return {
        isOver: monitor.isOver(),
        clientOffset: monitor.getClientOffset(),
        sourceOffset: monitor.getSourceClientOffset(),
        isDragging: !!(monitor.getItem()),
      };
    },
  });

  return connectDropTarget(connectDragSource(
    <div
      className={`${className} ${dropCollect.isOver ? 'dropTarget' : ''}`}
      data={JSON.stringify(dropCollect)}
      role="row"
      style={style}
      onMouseDown={event => onClick(event, index)}
      onDoubleClick={event => { console.debug('onDoubleClick: %o', { list: selected, index, event: event.nativeEvent, onPlay }); onPlay({ list: selected, index }); }}
      {...aria}
    >
      {columns}
    </div>
  ));
};

