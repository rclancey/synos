import React, { useCallback, useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";
import Draggable from 'react-draggable';
import { useColumns } from '../../../lib/colsize';
import { useFocus } from '../../../lib/useFocus';
import { AutoSizeList } from '../../AutoSizeList';
import { TrackRow } from './TrackRow';
import { useCurrentTrack } from '../../Player/Context';

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
  onShowInfo,
}) => {
  const { focused, focus, node, onFocus, onBlur } = useFocus(onKeyPress);
  const [cols, onResize, setColNode] = useColumns(columns);
  //const [, , setTLNode] = useMeasure(100, 100);
  const currentTrack = useCurrentTrack();

  const setNode = useCallback((xnode) => {
    if (xnode) {
      if (node.current !== xnode) {
        //console.debug('track list node changing from %o to %o', node.current, xnode);
        node.current = xnode;
        if (focused.current) {
          focus();
        }
        setColNode(xnode);
        //setTLNode(xnode);
      }
    }
  }, [setColNode, /*setTLNode,*/ focus, focused, node]);

  const selection = useMemo(() => tracks.filter(tr => tr.selected), [tracks]);
  const rowRenderer = useCallback(({ index, style }) => (
    <TrackRow
      device={type}
      selected={tracks[index].selected}
      selection={selection}
      current={currentTrack && tracks[index].track.persistent_id === currentTrack.persistent_id}
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
  ), [type, playlist, tracks, selection, cols, onReorder, onClick, onPlay, focus, currentTrack]);

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
          font-size: 12px;
          color: var(--text);
        }
        .trackList .header {
          border-bottom-color: var(--border);
          background-color: var(--contrast3);
          color: var(--text);
          display: flex;
          flex-direction: row;
          border-bottom: solid var(--border) 1px;
        }
        .trackList :global(.ReactVirtualized__Table__headerColumn) {
          border-right-color: var(--border);
        }
        .trackList:focus {
          outline: none;
        }
        .trackList:focus :global(.row.selected),
        .trackList:focus-within :global(.row.selected) {
          background-color: var(--highlight);
          color: var(--inverse);
        }
        .trackList :global(.stars) {
          font-family: monospace;
          color: var(--highlight);
          font-size: 20px;
        }
        .trackList:focus :global(.row.selected .stars),
        .trackList:focus-within :global(.row.selected .stars) {
          color: var(--inverse);
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
