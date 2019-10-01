import React, { useState, useRef, useEffect } from "react";
import { Column, Table } from "react-virtualized";

export const ColumnBrowser = ({
  title,
  items,
  width,
  height,
  lastIndex,
  onClick,
  onKeyPress,
}) => {
  const node = useRef(null);
  const [focused, setFocused] = useState(false);
  const [scrollToIndex, setScrollToIndex] = useState(-1);
  const lastScrollIndex = useRef(lastIndex);
  const focusRef = useRef(focused);
  useEffect(() => {
    focusRef.current = focused;
  }, [focused]);
  useEffect(() => {
    const handler = (event) => {
      if (focusRef.current) {
        onKeyPress(event);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, []);
  useEffect(() => {
    if (lastIndex !== lastScrollIndex.current && lastIndex >= 0) {
      setScrollToIndex(lastIndex);
      if (node.current) {
        console.debug('focusing %o node', title);
        node.current.focus();
      }
    } else {
      if (scrollToIndex !== undefined) {
        setScrollToIndex(undefined);
      }
    }
  });
  return (
    <div
      ref={n => node.current = n || node.current}
      className="columnBrowser"
      width={`${width}px`}
      onFocus={() => setFocused(true)}
      onBlur={() => { console.debug('%o node losing focus', title); setFocused(false); }}
    >
      <Table
        width={width}
        height={height}
        headerHeight={20}
        rowHeight={18}
        rowCount={items.length}
        rowGetter={({ index }) => items[index]}
        rowClassName={({index}) => {
          if (index < 0) {
            return 'header';
          }
          const item = items[index];
          return `row ${item && item.selected ? 'selected' : ''}`;
        }}
        scrollToIndex={scrollToIndex}
        onRowClick={({ event, index, rowData }) => onClick(event, index)}
        onScroll={() => {
          console.debug('%o table scrolled', title);
          if (focused && node.current) {
            console.debug('forcing focus on %o', title);
            node.current.firstElementChild.children[1].focus();
          }
        }}
      >
        <Column
          headerRenderer={undefined}
          dataKey="name"
          label={title}
          width={width}
        />
      </Table>
    </div>
  );
};
