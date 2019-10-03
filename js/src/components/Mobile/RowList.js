import React, { useState, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ScreenHeader } from './ScreenHeader';

export const RowList = ({
  name,
  items,
  selected,
  Indexer,
  indexerArgs,
  Child,
  childArgs,
  onSelect,
  rowRenderer,
  prev,
  controlAPI,
  adding,
  onClose,
  onTrackMenu,
  onAdd,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef(null);
  const onCloseMe = useMemo(() => {
    return () => {
      if (selected === null) {
        onClose();
      } else {
        onSelect(null);
      }
    };
  }, [selected, onSelect, onClose]);
  const onScroll = useMemo(() => {
    return ({ scrollOffset }) => setScrollTop(scrollOffset);
  }, [setScrollTop]);
  const subRenderer = useMemo(() => {
    return ({ key, index, style }) => rowRenderer({ key, index, style, onOpen: onSelect });
  }, [rowRenderer, onSelect]);

  if (selected !== null) {
    return (
      <Child
        prev={name}
        onClose={onCloseMe}
        onTrackMenu={onTrackMenu}
        controlAPI={controlAPI}
        adding={adding}
        onAdd={onAdd}
        {...childArgs}
      />
    );
  }
  return (
    <div className="rowList">
      <ScreenHeader
        name={name}
        prev={prev}
        onClose={onCloseMe}
      />
      <Indexer {...indexerArgs} height={45} list={ref} />
      <div className="items">
        <AutoSizer>
          {({width, height}) => (
            <List
              ref={ref}
              width={width}
              height={height}
              itemCount={items.length}
              itemSize={45}
              overscanCount={Math.ceil(height / 45)}
              initialScrollOffset={scrollTop}
              onScroll={onScroll}
            >
              {subRenderer}
            </List>
          )}
        </AutoSizer>
      </div>

      <style jsx>{`
        .rowList {
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          overflow: hidden;
        }
        .rowList .items {
          height: calc(100vh - 185px);
        }
        .rowList :global(.item) {
          display: flex;
          padding: 9px 0.5em 0px 0.5em;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }
        .rowList :global(.item .image) {
          flex: 1;
          width: 44px;
          min-width: 44px;
          max-width: 44px;
          height: 44px;
          margin-top: -2px;
          box-sizing: border-box;
          border: solid transparent 0px;
          background-size: cover;
          background-repeat: no-repeat;
          background-position: 50%;
          border-radius: 50%;
        }
        .rowList :global(.item .title) {
          flex: 10;
          font-size: 18px;
          line-height: 36px;
          padding-left: 0.5em;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

    </div>
  );
};
