import React, { useState, useCallback, useRef } from 'react';
import { AutoSizeList } from '../AutoSizeList';
import { ScreenHeader } from './ScreenHeader';

export const CoverList = ({
  name,
  items,
  selected,
  Indexer,
  indexerArgs,
  Child,
  childArgs,
  onSelect,
  itemRenderer,
  prev,
  controlAPI,
  adding,
  onClose,
  onTrackMenu,
  onAdd,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef(null);
  const onCloseMe = useCallback(() => {
    if (selected === null) {
      onClose();
    } else {
      onSelect(null);
    }
  }, [selected, onSelect, onClose]);
  const onScroll = useCallback(({ scrollOffset }) => {
    setScrollTop(scrollOffset);
  }, [setScrollTop]);
  const subRenderer = useCallback(({ key, index, style }) => {
    return (
      <div key={key} className="row" style={style}>
        <div className="padding" />
        {itemRenderer({ index: index * 2, onOpen: onSelect })}
        <div className="padding" />
        {itemRenderer({ index: index * 2 + 1, onOpen: onSelect })}
        <div className="padding" />
      </div>
    );
  }, [itemRenderer, onSelect]);

  if (selected !== null) {
    return (
      <Child
        prev={prev}
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
    <div className="coverList">
      <ScreenHeader
        name={name}
        prev={prev}
        onClose={onCloseMe}
      />
      <Indexer {...indexerArgs} height={195} list={ref} />
      <div className="items">
        <AutoSizeList
          xref={ref}
          offset={0}
          itemCount={Math.ceil(items.length / 2)}
          itemSize={195}
          initialScrollOffset={scrollTop}
          onScroll={onScroll}
        >
          {subRenderer}
        </AutoSizeList>
      </div>

      <style jsx>{`
        .coverList {
          width: 100vw;
          height: 100vh;
          box-sizing: border-box;
          overflow: hidden;
        }
        .coverList .items {
          height: calc(100vh - 185px);
        }
        .coverList :global(.row) {
          display: flex;
          flex-direction: row;
          padding-top: 1em;
        }
        .coverList :global(.row>.padding) {
          flex: 1;
          min-width: 5px;
        }
        .coverList :global(.item) {
          flex: 10;
          width: 155px;
          min-width: 155px;
          max-width: 155px;
          overflow: hidden;
          white-space: nowrap;
        }
        .coverList :global(.item .title) {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 11pt;
          padding-top: 5px;
        }
      `}</style>
    </div>
  );
};