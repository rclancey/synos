import React, { useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export const AutoSizeList = ({ offset = null, xref, itemSize, ...props }) => (
  <AutoSizer>
    {({width, height}) => (
      <FixedSizeList
        ref={xref}
        width={width}
        height={height - (offset === null ? itemSize : offset)}
        itemSize={itemSize}
        overscanCount={Math.ceil(height / itemSize)}
        {...props}
      />
    )}
  </AutoSizer>
);
