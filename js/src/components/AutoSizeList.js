import React, { useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const scrollPos = {};

export const scrollPreserver = (key) => {
  if (key === undefined || key === null) {
    return undefined;
  }
  return ({ scrollOffset, ...props }) => {
    console.debug('scrollPos[%o] = %o (%o)', key, scrollOffset, props);
    scrollPos[key] = scrollOffset;
  };
};

export const fetchScroll = (key) => {
  if (key === undefined || key === null) {
    return undefined;
  }
  console.debug('fetchScroll(%o) = %o', key, scrollPos[key]);
  return scrollPos[key];
};

export const AutoSizeList = ({ id, offset = null, xref, itemSize, ...props }) => {
  const initialScroll = useMemo(() => fetchScroll(id), [id]);
  const onScroll = useMemo(() => scrollPreserver(id), [id]);
  return (
    <AutoSizer>
      {({width, height}) => (
        <FixedSizeList
          ref={xref}
          width={width}
          height={height - (offset === null ? itemSize : offset)}
          itemSize={itemSize}
          overscanCount={Math.ceil(height / itemSize)}
          initialScrollOffset={initialScroll}
          onScroll={onScroll}
          {...props}
        />
      )}
    </AutoSizer>
  );
};
