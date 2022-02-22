import React, { useCallback, useMemo, useState, useRef } from 'react';
import _JSXStyle from "styled-jsx/style";
import Draggable from 'react-draggable';
import { useColumns } from '../../../lib/colsize';
import { useFocus } from '../../../lib/useFocus';
import { usePlaylistColumns } from '../../../lib/playlistColumns';
import { AutoSizeList } from '../../AutoSizeList';
import { TrackRow } from './TrackRow';
import { useCurrentTrack } from '../../Player/Context';
import { ColumnMenu } from './ColumnMenu';

const autoSizerStyle = { overflow: 'overlay' };

const resizePos = { x: 0 };

const TrackListColumnHeader = ({
  dataKey,
  label,
  width,
  onSort,
  onResize,
  onMove,
}) => {
  const dragged = useRef(false);
  const resizing = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const onDragStart = useCallback((evt, dragData) => {
    if (resizing.current) {
      return;
    }
    const pos = { x: dragData.x, y: 0 };
    dragged.current = false;
    setDragging(true);
    setDragPos(pos);
  }, []);
  const onDragEnd = useCallback((evt, dragData) => {
    if (resizing.current) {
      return;
    }
    console.debug('dragEnd: %o', dragData);
    setDragging(false);
    setDragPos({ x: 0, y: 0 });
    if (dragged.current) {
      evt.preventDefault();
      evt.stopPropagation();
      onMove(dataKey, dragData.x);
    } else {
      if (evt.button === 0 && !evt.ctrlKey && !evt.altKey && !evt.metaKey && !evt.shiftKey) {
        onSort(dataKey);
      }
    }
  }, [dataKey, onSort, onMove]);
  const onDrag = useCallback((evt, dragData) => {
    if (resizing.current) {
      return;
    }
    setDragPos({ x: dragData.x, y: 0 });
    if (Math.abs(dragData.x) > 2) {
      dragged.current = true;
    }
  }, []);
  const onResizeStart = useCallback((evt) => {
    resizing.current = true;
    evt.preventDefault();
    evt.stopPropagation();
  }, []);
  const onResizeEnd = useCallback(() => {
    resizing.current = false;
  }, []);
  const onResizeDrag = useCallback((evt, dragData) => onResize(dataKey, dragData.deltaX), [onResize, dataKey]);
  return (
    <div className="colWrap">
      <Draggable
        axis="x"
        position={dragPos}
        onStart={onDragStart}
        onStop={onDragEnd}
        onDrag={onDrag}
      >
        <div className={`col ${dragging ? 'dragging' : ''}`}>
          <div
            key={dataKey}
            className="ReactVirtualized__Table__headerTruncatedText label"
          >
            {label}
          </div>
          <Draggable
            axis="x"
            defaultClassName="DragHandle"
            defaultClassNameDragging="DragHandleActive"
            onStart={onResizeStart}
            onStop={onResizeEnd}
            onDrag={onResizeDrag}
            position={resizePos}
            zIndex={999}
          >
            <span className="DragHandleIcon">⋮</span>
          </Draggable>
        </div>
      </Draggable>
      { dragging ? (
        <div className="col">
          <div className="ReactVirtualized__Table__headerTruncatedText label"></div>
          <span className="DragHandleIcon">⋮</span>
        </div>
      ) : null }
      <style jsx>{`
        .col {
          flex: 0 0 ${width}px;
          width: ${width}px;
          min-width: ${width}px;
          max-width: ${width}px;
          display: flex;
          flex-direction: row;
          font-weight: bold;
          box-sizing: border-box;
          padding: 1px 0px 1px 5px;
        }
        .col.dragging {
          position: absolute;
          z-index: 1000;
          background-color: var(--contrast3);
          cursor: grabbing;
        }
        .col .label {
          cursor: default;
        }
      `}</style>
    </div>
  );
};

export const TrackListHeader = ({ columns, onSort }) => {
  const [contextMenu, setContextMenu] = useState(null);
  const onContextMenu = useCallback((evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    const pos = {
      x: evt.layerX + evt.target.offsetLeft + evt.target.offsetParent.offsetLeft,
      y: evt.layerY,
    };
    setContextMenu(pos);
    const h = () => {
      try {
        setContextMenu(null);
      } catch (err) {
        // noop
      }
      document.removeEventListener('click', h, false);
    };
    document.addEventListener('click', h, false);
  }, []);
  const onToggleCol = useCallback((evt) => {
    let node = evt.target;
    while (!node.className.match(/\boption\b/) && node.parentNode) {
      node = node.parentNode;
    }
    const key = node.dataset.key;
    columns.onToggle(key);
    setContextMenu(null);
  }, [columns.onToggle]);
  const style = useMemo(() => ({ width: `${columns.width}px` }), [columns.width]);

  return (
    <div className="header" style={style} onContextMenu={onContextMenu}>
      { columns.cols.map(col => (
        <TrackListColumnHeader
          key={col.key}
          width={col.width}
          columnData={col}
          dataKey={col.key}
          label={col.label}
          onSort={onSort}
          onResize={columns.onResize}
          onMove={columns.onMove}
        />
      )) }
      { contextMenu ? (
        <ColumnMenu
          avail={columns.avail}
          onToggle={onToggleCol}
          pos={contextMenu}
        />
      ) : null }
      <style jsx>{`
        .header {
          border-bottom-color: var(--border);
          background-color: var(--contrast3);
          color: var(--text);
          display: flex;
          flex-direction: row;
          border-bottom: solid var(--border) 1px;
          min-width: 100%;
        }
        .header :global(.ReactVirtualized__Table__headerColumn) {
          border-right-color: var(--border);
        }
        .header :global(.DragHandle) {
          flex: 0 0 16px;
          z-index: 2;
          cursor: col-resize;
        }
        .header :global(.DragHandleActive),
        .header :global(.DragHandleActive:hover),
          z-index: 3;
        }
        .header :global(.DragHandleIcon) {
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

export default TrackListHeader;
