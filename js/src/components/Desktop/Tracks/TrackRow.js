import React, { useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useTheme } from '../../../lib/theme';

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
  const colors = useTheme();

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

  const onMouseDown = useCallback((event) => onClick(event, index), [index, onClick]);
  const onDoubleClick = useCallback((event) => {
    console.debug('onDoubleClick: %o', { list: selected, index, event: event.nativeEvent, onPlay });
    onPlay({ list: selected, index });
  }, [selected, index, onPlay]);

  return connectDropTarget(connectDragSource(
    <div
      className={`${className} ${dropCollect.isOver ? 'dropTarget' : ''}`}
      style={style}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      { columns.map(col => (
        <Cell key={col.key} col={col} rowData={rowData} colors={colors} />
      )) }
      <style jsx>{`
        div {
          display: flex;
          flex-direction: row;
          border-bottom: solid transparent 1px;
          box-sizing: border-box;
          color: ${colors.trackList.text};
        }
        .even {
          background-color: ${colors.trackList.evenBg};
        }
        .selected, .even.selected {
          background-color: ${colors.blurHighlight};
        }
        .dropTarget {
          border-bottom-color: blue;
          border-bottom-width: 2px;
          z-index: 1;
        }
      `}</style>
    </div>
  ));
};

const Cell = React.memo(({ rowData, col, colors }) => (
  <div className={col.className}>
    {col.formatter ? col.formatter({ rowData, dataKey: col.key }) : rowData[col.key]}
    <style jsx>{`
      div {
        flex: 0 0 ${col.width}px;
        width: ${col.width}px;
        min-width: ${col.width}px;
        max-width: ${col.width}px;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0px 10px 0px 5px;
        line-height: 20px;
        box-sizing: border-box;
      }
      .num, .time {
        text-align: right;
      }
      .num, .time, .date {
        font-family: sans-serif;
        white-space: pre;
      }
      .stars {
        font-family: monospace;
        color: ${colors.highlightText};
      }
      .empty {
        padding: 0px;
      }
    `}</style>
  </div>
));
