import React, { useCallback } from 'react';
import Draggable from 'react-draggable';
import { useTheme } from '../../../lib/theme';
import { useColumns } from '../../../lib/colsize';
import { useMeasure } from '../../../lib/useMeasure';
import { useFocus } from '../../../lib/useFocus';
import { AutoSizeList } from '../../AutoSizeList';
import { TrackRow } from './TrackRow';

const TrackListHeader = React.memo(({
  columnData,
  dataKey,
  disableSort,
  label,
  sortBy,
  sortDirection,
  onSort,
  onResize,
}) => (
  <div className="col">
    <div
      key={dataKey}
      className="ReactVirtualized__Table__headerTruncatedText"
      onClick={() => onSort(dataKey)}
    >
      {label}
    </div>
    <Draggable
      axis="x"
      defaultClassName="DragHandle"
      defaultClassNameDragging="DragHandleActive"
      onDrag={(event, { deltaX }) => onResize(dataKey, deltaX)}
      position={{ x: 0 }}
      zIndex={999}
    >
      <span className="DragHandleIcon">⋮</span>
    </Draggable>
    <style jsx>{`
      .col {
        flex: 0 0 ${columnData.width}px;
        width: ${columnData.width}px;
        min-width: ${columnData.width}px;
        max-width: ${columnData.width}px;
        display: flex;
        flex-direction: row;
        font-weight: bold;
        box-sizing: border-box;
        padding: 1px 0px 1px 5px;
      }
    `}</style>
  </div>
));

export const TrackList = ({
  type,
  columns,
  tracks,
  selected,
  playlist,
  onSort,
  onClick,
  onKeyPress,
  onPlay,
  onReorder,
  onDelete,
}) => {
  const colors = useTheme();
  const { focused, focus, node, onFocus, onBlur } = useFocus(onKeyPress);
  const [cols, onResize, setColNode] = useColumns(columns);
  const [, , setTLNode] = useMeasure(100, 100);

  const setNode = useCallback((xnode) => {
    if (xnode) {
      if (node.current !== xnode) {
        console.debug('track list node changing from %o to %o', node.current, xnode);
        node.current = xnode;
        if (focused.current) {
          focus();
        }
        setColNode(xnode);
        setTLNode(xnode);
      }
    }
  }, [setColNode, setTLNode, focus, focused, node]);

  const rowRenderer = useCallback(({ index, style }) => (
    <TrackRow
      device={type}
      selected={tracks[index].selected}
      selection={tracks.filter(tr => tr.selected)}
      playlist={playlist}
      index={index}
      rowData={tracks[index].track}
      className={`row ${index % 2 === 0 ? 'even' : 'odd'} ${tracks[index].selected ? 'selected' : ''}`}
      style={style}
      columns={cols}
      onReorder={onReorder}
      onClick={(event, index) => {
        event.preventDefault();
        event.stopPropagation();
        focus();
        onClick(event, index);
      }}
      onPlay={onPlay}
    />
  ), [type, playlist, tracks, cols, onReorder, onClick, onPlay, focus]);

  return (
    <div
      ref={setNode}
      tabIndex={0}
      className="trackList"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="header">
        { cols.map(col => (
          <TrackListHeader
            key={col.key}
            columnData={col}
            dataKey={col.key}
            label={col.label}
            onSort={onSort}
            onResize={onResize}
          />
        )) }
      </div>
      <AutoSizeList itemCount={tracks.length} itemSize={20}>
        {rowRenderer}
      </AutoSizeList>
      <style jsx>{`
        .trackList {
          flex: 10;
          width: 100%;
          overflow: hidden;
          background-color: ${colors.trackList.background};
          font-size: 12px;
          color: ${colors.trackList.text};
        }
        .trackList .header {
          border-bottom-color: ${colors.trackList.border};
          background-color: ${colors.trackList.background};
          color: ${colors.trackList.text};
          display: flex;
          flex-direction: row;
          border-bottom: solid ${colors.trackList.border} 1px;
        }
        .trackList :global(.ReactVirtualized__Table__headerColumn) {
          border-right-color: ${colors.trackList.separator};
        }
        .trackList:focus {
          outline: none;
        }
        .trackList:focus :global(.row.selected),
        .trackList:focus-within :global(.row.selected) {
          background-color: ${colors.highlightText};
          color: ${colors.highlightInverse};
        }
        .trackList :global(.DragHandle) {
          flex: 0 0 16px;
          z-index: 2;
          cursor: col-resize;
        }
        .trackList :global(.DragHandleActive),
        .trackList :global(.DragHandleActive:hover),
          z-index: 3;
        }
        .trackList :global(.DragHandleIcon) {
          flex: 0 0 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
};
