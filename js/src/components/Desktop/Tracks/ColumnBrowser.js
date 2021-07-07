import React, { useRef, useEffect, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";
import { useTheme } from '../../../lib/theme';
import { useFocus } from '../../../lib/useFocus';
import { AutoSizeList } from '../../AutoSizeList';

const ColBrowserRow = React.memo(({
  index,
  item,
  style,
  nodeRef,
  onClick,
}) => (
  <div
    className={`row ${item && item.selected ? 'selected' : ''}`}
    style={style}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      if (nodeRef.current) {
        nodeRef.current.focus();
      }
      onClick(event, index);
    }}
  >
    {item.name}
    <style jsx>{`
      .row {
        padding: 0px 10px;
        line-height: 18px;
      }
    `}</style>
  </div>
));

export const ColumnBrowser = ({
  tabIndex,
  title,
  items,
  width,
  height,
  lastIndex,
  onClick,
  onKeyPress,
}) => {
  const colors = useTheme();
  const { node, onFocus, onBlur } = useFocus(onKeyPress);
  const lastScrollIndex = useRef(lastIndex);
  const listRef = useRef(null);

  useEffect(() => {
    if (lastIndex !== lastScrollIndex.current && lastIndex >= 0) {
      if (listRef.current) {
        listRef.current.scrollToItem(lastIndex, 'smart');
      }
    } else if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [lastIndex]);

  const rowRenderer = useCallback(({ index, style }) => (
    <ColBrowserRow
      index={index}
      item={items[index]}
      style={style}
      nodeRef={node}
      onClick={onClick}
    />
  ), [items, onClick, node]);

  return (
    <div
      ref={node}
      className="columnBrowser"
      tabIndex={tabIndex}
      style={{ width: `${width}px` }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="header">{title}</div>
      <AutoSizeList
        xref={listRef}
        itemCount={items.length}
        itemSize={18}
      >
        {rowRenderer}
      </AutoSizeList>
      <style jsx>{`
        .columnBrowser {
          border-right-style: solid;
          border-right-width: 1px;
          overflow: hidden;
          /*
          background-color: ${colors.trackList.background};
          */
          background-color: var(--contrast3);
          border-right-color: var(--border);
          color: var(--text);
          font-size: 12px;
          cursor: default;
        }
        .columnBrowser:focus {
          outline: none;
        }
        .columnBrowser .header {
          /*
          background-color: ${colors.trackList.background};
          */
          background-color: var(--contrast3);
          color: var(--text);
          border-bottom: solid var(--border) 1px;
          border-right: none !important;
          font-weight: bold;
          white-space: nowrap;
          line-height: 18px;
          padding: 0px 10px;
          box-sizing: border-box;
          height: 18px;
        }
        .columnBrowser :global(.row.selected) {
          /*
          background-color: ${colors.blurHighlight};
          */
          background-color: var(--highlight-blur);
        }
        .columnBrowser:focus-within :global(.row.selected) {
          background-color: var(--highlight);
          color: var(--inverse);
        }
      `}</style>
    </div>
  );
};
