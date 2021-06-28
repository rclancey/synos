import React, { useCallback, useRef } from 'react';
import { useStack } from './Router/StackContext';
import { AutoSizeList } from '../AutoSizeList';
import { ScreenHeader } from './ScreenHeader';

export const CoverList = ({
  name,
  items,
  Indexer,
  indexerArgs,
  itemRenderer,
  controlAPI,
  adding,
  onAdd,
}) => {
  const stack = useStack();
  const page = stack.pages[stack.pages.length - 1];
  const scrollTop = page ? page.scrollOffset : 0;
  const ref = useRef(null);
  const rowRenderer = useCallback(({ key, index, style }) => {
    return (
      <div key={key} className="row" style={style}>
        <div className="padding" />
        {itemRenderer({ index: index * 2 })}
        <div className="padding" />
        {itemRenderer({ index: index * 2 + 1 })}
        <div className="padding" />
      </div>
    );
  }, [itemRenderer]);

  return (
    <div className="coverList">
      <ScreenHeader name={name} />
      <Indexer {...indexerArgs} height={195} list={ref} />
      <div className="items">
        <AutoSizeList
          xref={ref}
          offset={0}
          itemCount={Math.ceil(items.length / 2)}
          itemSize={195}
          initialScrollOffset={scrollTop}
          onScroll={stack.onScroll}
        >
          {rowRenderer}
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
