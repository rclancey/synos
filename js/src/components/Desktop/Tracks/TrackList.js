import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { Column, Table } from "react-virtualized";
import Draggable from "react-draggable";
import { DragSource, DropTarget } from 'react-dnd';
import { useColumns } from '../../../lib/colsize';
import { useMeasure } from '../../../lib/useMeasure';
import { PlayerContext } from '../../../lib/playerContext';
import { TrackRow } from './TrackRow';
import { useTheme } from '../../../lib/theme';

const TrackListHeader = ({
  columnData,
  dataKey,
  disableSort,
  label,
  sortBy,
  sortDirection,
  onSort,
  onResize,
}) => {
  const colors = useTheme();
  return (
    <>
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
    </>
  );
};

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
  const [focused, setFocused] = useState(false);
  const [cols, onResize, setColNode] = useColumns(columns);
  const [width, height, setTLNode] = useMeasure(100, 100);
  const focusRef = useRef(focused);
  const { onReplaceQueue, onSetPlaylist } = useContext(PlayerContext);
  useEffect(() => {
    focusRef.current = focused;
  }, [focused]);
  useEffect(() => {
    const onKeyPressWithFocus = event => {
      if (focusRef.current) {
        onKeyPress(event);
      }
    };
    document.addEventListener('keydown', onKeyPressWithFocus, true);
    return () => {
      document.removeEventListener('keydown', onKeyPressWithFocus, true);
    };
  });
  const setNode = node => {
    setColNode(node);
    setTLNode(node);
  };
  const renderHeader = (props) => (
    <TrackListHeader
      onSort={onSort}
      onResize={onResize}
      {...props}
    />
  );
  const renderRow = (props) => (
    <TrackRow
      type={type}
      selected={selected}
      playlist={playlist}
      onReorder={onReorder}
      onClick={onClick}
      onPlay={onPlay}
      {...props}
    />
  );
  return (
    <div
      ref={setNode}
      className="trackList"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <Table
        width={width}
        height={height}
        headerHeight={20}
        rowHeight={20}
        rowCount={tracks.length}
        rowGetter={({ index }) => tracks[index].track}
        rowClassName={({ index }) => {
          if (index < 0) {
            return 'header';
          }
          const cls = [index % 2 === 0 ? 'even' : 'odd'];
          if (tracks[index].selected) {
            cls.push('selected');
          }
          return cls.join(' ');
        }}
        onRowClick={args => console.debug('row click %o', args)}
        onRowDoubleClick={args => console.debug('row double click %o', args)}
        rowRenderer={renderRow}
      >
        { cols.map(col => (
          <Column
            key={col.key}
            headerRenderer={renderHeader}
            dataKey={col.key}
            label={col.label}
            width={col.width}
            className={col.className}
            cellDataGetter={col.formatter ? props => col.formatter(props) : undefined}
          />
        )) }
      </Table>
      <style jsx>{`
        .trackList {
          flex: 10;
          width: 100%;
          overflow: hidden;
          background-color: ${colors.trackList.background};
        }
        .trackList :global(.ReactVirtualized__Table__headerRow) {
          border-bottom-color: ${colors.trackList.border};
          background-color: ${colors.trackList.background};
          color: ${colors.trackList.text};
        }
        .trackList :global(.ReactVirtualized__Table__headerColumn) {
          border-right-color: ${colors.trackList.separator};
        }
        .trackList :global(.ReactVirtualized__Table__row) {
          box-sizing: border-box;
          border-bottom-style: solid;
          border-bottom-width: 1px;
          background-color: ${colors.trackList.background};
          color: ${colors.trackList.text};
          border-color: transparent;
        }
        .trackList :global(.ReactVirtualized__Table__row.dropTarget) {
          border-bottom-color: blue;
        }
        .trackList :global(.ReactVirtualized__Table__row.even) {
          background-color: ${colors.trackList.evenBg};
        }
        .trackList :global(.ReactVirtualized__Table__row.selected),
        .trackList :global(.ReactVirtualized__Table__row.selected.even) {
          background-color: ${colors.blurHighlight};
        }
        .trackList:focus-within :global(.ReactVirtualized__Table__row.selected) {
          background-color: ${colors.highlightText};
          color: ${colors.highlightInverse};
        }
        .trackList :global(.ReactVirtualized__Table__row.dropTarget) {
          border-bottom-style: solid;
          border-bottom-width: 2px;
          z-index: 1;
        }
        .trackList :global(.ReactVirtualized__Table__rowColumn.num),
        .trackList :global(.ReactVirtualized__Table__rowColumn.time) {
          text-align: right;
        }
        .trackList :global(.ReactVirtualized__Table__rowColumn.num),
        .trackList :global(.ReactVirtualized__Table__rowColumn.time),
        .trackList :global(.ReactVirtualized__Table__rowColumn.date) {
          font-family: sans-serif;
          white-space: pre;
        }
        .trackList :global(.ReactVirtualized__Table__rowColumn.stars) {
          font-family: monospace;
          color: ${colors.highlightText};
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
