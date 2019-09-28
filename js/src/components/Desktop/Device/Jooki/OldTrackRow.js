import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';

const dragSource = {
  beginDrag(props, monitor, component) {
    const type = `${props.type || ''}Track`;
    let tracks = props.playlist.tracks.map((rowData, index) => {
      if (props.selected && props.selected[rowData.persistent_id]) {
        return { type, index, rowData };
      }
      return null;
    }).filter(rec => rec !== null);
    if (tracks.length === 0) {
      const index = props.playlist.tracks.findIndex(x => x === props.rowData);
      const rowData = props.rowData;
      tracks = [{ type, index, rowData }];
    }
    return {
      type: `${type}List`,
      src_playlist_id: props.playlist ? props.playlist.persistent_id : null,
      tracks: tracks,
    };
  },
};

const dropTarget = {
  drop(props, monitor, component) {
    if (props.onReorderTracks) {
      const item = monitor.getItem();
      props.onReorderTracks(props.playlist, props.index, item.tracks.map(t => t.index));
    }
  },
  canDrop(props, monitor, component) {
    if (!props.onReorderTracks) {
      return false;
    }
    if (!props.playlist) {
      return false;
    }
    const item = monitor.getItem();
    const type = `${props.type || ''}TrackList`;
    if (type !== item.type) {
      return false;
    }
    if (!props.playlist || props.playlist.persistent_id !== item.src_playlist_id) {
      return false;
    }
    return true;
  }
}

function dragCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
}

function dropCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  };
}

const BaseJookiTrack = ({
  connectDragSource,
  connectDropTarget,
  isOver,
  isDragging,
  type,
  playlist,
  index,
  rowData,
  className,
  style,
  columns,
  selected,
  onTrackPlay,
  onReorderTracks,
  onTrackSelect,
}) => {
  const aria = {
    'aria-label': 'row',
    'aria-rowindex': index,
  };
  return connectDropTarget(connectDragSource(
    <div
      className={`${className} ${selected && selected[rowData.persistent_id] ? 'selected' : ''} ${isOver ? 'dropTarget' : ''}`}
      role="row"
      onClick={() => onTrackSelect(rowData)}
      onDoubleClick={() => onTrackPlay(index)}
      style={style}
      {...aria}
    >
      {columns}
    </div>
  ));
};

export const JookiTrack = DragSource('Track', dragSource, dragCollect)(
  DropTarget('Track', dropTarget, dropCollect)(BaseJookiTrack)
);

