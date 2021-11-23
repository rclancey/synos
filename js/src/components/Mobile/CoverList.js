import React, { useCallback, useRef } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { AutoSizeList } from '../AutoSizeList';
import { ScreenHeader } from './ScreenHeader';

export const CoverList = ({
  id,
  name,
  items,
  height = 195,
  Indexer,
  indexerArgs,
  itemRenderer,
  controlAPI,
  adding,
  onAdd,
}) => {
  const ref = useRef(null);
  const rowRenderer = useCallback(({ key, index, style }) => {
    return (
      <div key={key} className="itemrow" style={style}>
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
      { Indexer ? (
        <Indexer {...indexerArgs} height={height} list={ref} />
      ) : null }
      <div className="items">
        <AutoSizeList
          id={id}
          xref={ref}
          offset={0}
          itemCount={Math.ceil(items.length / 2)}
          itemSize={height}
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
        .coverList :global(.itemrow) {
          display: flex;
          flex-direction: row;
          padding-top: 1em;
        }
        .coverList :global(.itemrow>.padding) {
          flex: 1;
          min-width: 5px;
        }
        .coverList :global(.item) {
          display: block;
          flex: 10;
          width: 155px;
          min-width: 155px;
          max-width: 155px;
          overflow: hidden;
          white-space: nowrap;
        }
        .coverList :global(.item .title),
        .coverList :global(.item .artist) {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 11pt;
        }
        .coverList :global(.item .title),
          padding-top: 5px;
        }
      `}</style>
    </div>
  );
};
