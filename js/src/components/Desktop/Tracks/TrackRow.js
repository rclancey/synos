import React, { useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useTheme } from '../../../lib/theme';

export const TrackRow = ({
  device,
  selected,
  selection,
  current,
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
    type: 'TrackList',
    item: {
      type: 'TrackList',
      device,
      playlist,
      tracks: selection && selection.length > 0 ? selection : [{ index, track: rowData }],
    },
    isDragging(monitor) {
      return selection.some(tr => tr.track.origIndex === rowData.origIndex);
    },
  });

  const [dropCollect, connectDropTarget] = useDrop({
    accept: ['TrackList'],
    drop(item, monitor) {
      console.debug('drop %o', item);
      if (onReorder) {
        onReorder(playlist, index + 1, item.tracks.map(t => t.track.origIndex));
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
    //const tracks = selection.map(row => row.track);
    console.debug('onDoubleClick: %o', { list: selection, index, event: event.nativeEvent, onPlay });
    onPlay({ list: selection, index });
  }, [selection, index, onPlay]);

  return connectDropTarget(connectDragSource(
    <div
      className={`${className} ${dropCollect.isOver ? 'dropTarget' : ''}`}
      style={style}
      onClick={onMouseDown}
      onDoubleClick={onDoubleClick}
    >
      { current ? (
        <span className="fas fa-play current" />
      ) : null }
      { columns.map(col => (
        <Cell key={col.key} col={col} rowData={rowData} colors={colors} selected={selected} />
      )) }
      <style jsx>{`
        div {
          display: flex;
          flex-direction: row;
          border-bottom: solid transparent 1px;
          box-sizing: border-box;
          color: ${colors.trackList.text};
        }
        .current {
          display: inline-block;
          width: 0;
          margin-left: 5px;
          margin-right: -5px;
          font-size: 8px;
          line-height: 20px;
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

const Cell = React.memo(({ rowData, col, colors, selected }) => (
  <div className={col.className}>
    {col.formatter ? col.formatter({ rowData, dataKey: col.key }) : rowData[col.key]}
    <style jsx>{`
      div {
        flex: 0 0 ${col.width}px;
        width: ${col.width}px;
        min-width: ${col.width}px;
        max-width: ${col.width}px;
        white-space: nowrap;
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
        color: ${selected ? colors.highlightInverse : colors.highlightText};
        font-size: 20px;
      }
      .empty {
        padding: 0px;
      }
    `}</style>
  </div>
));
