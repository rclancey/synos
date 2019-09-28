import React, { useState, useRef, useEffect } from 'react';
import { Column, Table } from 'react-virtualized';
import * as COLUMNS from '../../../lib/columns';
import { JookiTrack } from './TrackRow';

export const JookiTrackList = ({
  playlist,
  selected,
  onReorderTracks,
}) => {
  const node = useRef(null);
  const [totalWidth, setTotalWidth] = useState(100);
  const [totalHeight, setTotalHeight] = useState(100);
  const autosize = (cols, w) => {
    const sum = cols.reduce((acc, col) => acc + col.width, 0) || 1;
    return cols.map(col => Object.assign({}, col, { width: col.width * w / sum }));
  };
  const [columns, setColumns] = useState(autosize([
    Object.assign({}, COLUMNS.TRACK_TITLE, { width: 15 }),
    Object.assign({}, COLUMNS.TIME, { width: 3 }),
    Object.assign({}, COLUMNS.ARTIST, { width: 10 }),
    Object.assign({}, COLUMNS.ALBUM_TITLE, { width: 12 }),
  ], totalWidth));

  useEffect(() => {
    if (node.current) {
      console.debug('track list node: %o x %o', node.current.offsetWidth, node.current.offsetHeight);
      if (Math.abs(totalHeight - node.current.offsetHeight) > 2) {
        setTotalHeight(node.current.offsetHeight);
      }
      if (totalWidth !== node.current.offsetWidth) {
        setTotalWidth(node.current.offsetWidth);
      }
    }
  }, [node.current, node.current ? node.current.offsetWidth : 100, node.current ? node.current.offsetHeight : 100]);
  useEffect(() => {
    setColumns(autosize(columns, totalWidth));
  }, [totalWidth]);

  const renderHeader = ({
    columnData,
    dataKey,
    disableSort,
    label,
    sortBy,
    sortDirection,
  }) => {
    return (
      <div
        key={dataKey}
        className="ReactVirtualized__Table__headerTruncatedText"
      >
        {label}
      </div>
    );
  };

  const rowRenderer = (props) => {
    return (
      <JookiTrack
        type="Jooki"
        playlist={playlist}
        onReorderTracks={onReorderTracks}
        selected={selected}
        {...props}
      />
    );
  };
    

  return (
    <div
      ref={n => { if (n && n !== node.current) { node.current = n } }}
      style={{ flex: 10, width: '100%', overflow: 'hidden' }}
    >
      <Table
        width={totalWidth}
        height={totalHeight}
        headerHeight={20}
        rowHeight={20}
        rowCount={playlist.tracks.length}
        rowGetter={({ index }) => playlist.tracks[index]}
        rowClassName={({ index }) => index < 0 ? 'header' : index % 2 === 0 ? 'even' : 'odd'}
        onRowClick={args => console.debug('row click %o', args)}
        onRowDoubleClick={args => console.debug('row double click %o', args)}
        rowRenderer={rowRenderer}
      >
        { columns.map(col => (
          <Column
            key={col.key}
            headerRenderer={renderHeader}
            dataKey={col.key}
            label={col.label}
            width={col.width}
            className={col.className}
            cellDataGetter={col.formatter ? props => col.formatter(props) : undefined}
          />
        )) }
      </Table>
    </div>
  );
};
