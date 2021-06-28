import React, { useRef } from 'react';
import { useStack } from './Router/StackContext';
import { AutoSizeList } from '../AutoSizeList';
import { ScreenHeader } from './ScreenHeader';

export const RowList = ({
  name,
  items,
  Indexer,
  indexerArgs,
  rowRenderer,
  controlAPI,
  adding,
  onAdd,
}) => {
  const stack = useStack();
  const page = stack.pages[stack.pages.length - 1];
  const scrollTop = page ? page.scrollOffset : 0;
  const ref = useRef(null);

  return (
    <div className="rowList">
      <ScreenHeader name={name} />
      <Indexer {...indexerArgs} height={45} list={ref} />
      <div className="items">
        <AutoSizeList
          xref={ref}
          itemCount={items.length}
          itemSize={45}
          offset={0}
          initialScrollOffset={scrollTop}
          onScroll={stack.onScroll}
        >
          {rowRenderer}
        </AutoSizeList>
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
