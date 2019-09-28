import React, { useState, useRef, useEffect }from 'react';
import { Column, Table } from 'react-virtualized';
import Draggable from 'react-draggable';
import { DragSource, DropTarget } from 'react-dnd';
import * as COLUMNS from '../../../../lib/columns';
import { Folder, PlaylistRow } from '../../TreeView2';
import { jookiTokenImgUrl } from './token';

export const JookiDevicePlaylist = ({
  device,
  selected,
  onSelect,
}) => {
  if (!device) {
    return null;
  }
  return (
    <Folder
      depth={0}
      indentPixels={12}
      icon="/jooki.png"
      name="Jooki"
    >
      { device.playlists
        .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        .map(item => (
          <PlaylistRow
            key={item.persistent_id}
            depth={1}
            indentPixels={12}
            icon={item.token ? jookiTokenImgUrl(item.token) : null}
            name={item.name}
            selected={selected === item.persistent_id}
            onSelect={() => onSelect(item, <JookiTrackBrowser device={device} playlist={item} />)}
          />
        )) }
    </Folder>
  );
};

const JookiPlaylistHeader = ({ playlist }) => {
  const durm = playlist.tracks.reduce((acc, tr) => acc + tr.total_time, 0) / 60000;
  const sizem = playlist.tracks.reduce((acc, tr) => acc + tr.size, 0) / (1024 * 1024);
  let dur = '';
  if (durm > 36 * 60) {
    const days = Math.floor(durm / (24 * 60));
    const hours = Math.round((durm % (24 * 60)) / 60);
    dur = `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else if (durm > 60) {
    const hours = Math.floor(durm / 60);
    const mins = Math.round(durm % 60);
    dur = `${hours}:${mins < 10 ? '0' + mins : mins}`;
  } else {
    const mins = Math.round(durm * 10) / 10;
    dur = `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  let size = '';
  if (sizem >= 10240) {
    size = `${Math.round(sizem / 1024)} GB`;
  } else if (sizem > 1024) {
    size = `${Math.round(sizem / 102.4) * 10} GB`;
  } else {
    size = `${Math.round(sizem)} MB`;
  }
  console.debug('header: %o', { playlist, durm, sizem, dur, size });
  return (
    <div className="header">
      <div className="token">
        <img src={playlist.token ? jookiTokenImgUrl(playlist.token) : "/nocover.jpg"} />
      </div>
      <div className="meta">
        <div className="title">{playlist.name}</div>
        <div className="size">
          {playlist.tracks.length}
          {playlist.tracks.length === 1 ? ' song' : ' songs'}
          {' \u2022 '}{dur}
          {' \u2022 '}{size}
        </div>
      </div>
    </div>
  );
};

const rowSource = {
  beginDrag(props, monitor, component) {
    console.debug('beginDrag(%o, %o, %o)', props, monitor, component);
    const tracks = props.playlist.tracks.map((rowData, index) => {
      if (props.selected && props.selected[rowData.persistent_id]) {
        return { index, rowData };
      }
      return null;
    }).filter(rec => rec !== null);
    return { tracks };
  },
};

const rowTarget = {
  drop(props, monitor, component) {
    console.debug('drop track %o at %o', monitor.getItem(), props);
    props.onReorderTracks(props.playlist, props.index, monitor.getItem().tracks.map(t => t.index));
  },
}

function dragCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
}

function dropCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  };
}

const RawJookiTrack = ({
  connectDragSource,
  connectDropTarget,
  isOver,
  isDragging,
  index,
  rowData,
  className,
  style,
  columns,
  selected,
}) => {
  const aria = {
    'aria-label': 'row',
    'aria-rowindex': index,
  };
  return connectDropTarget(connectDragSource(
    <div
      className={`${className} ${isOver ? 'dropTarget' : ''}`}
      role="row"
      style={style}
      {...aria}
    >
      {columns}
    </div>
  ));
};

const JookiTrack = DragSource('Track', rowSource, dragCollect)(DropTarget('Track', rowTarget, dropCollect)(RawJookiTrack));

const JookiTrackList = ({
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

const JookiTrackBrowser = ({
  device,
  playlist,
}) => {
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState({});
  const [lastSelection, setLastSelection] = useState(null);
  const onSelect = ({ event, index, rowData }) => {
    event.stopPropagation();
    event.preventDefault();
    const id = playlist.tracks[index].persistent_id;
    if (event.metaKey) {
      const sel = Object.assign({}, selected);
      if (sel[id]) {
        delete(sel[id]);
      } else {
        sel[id] = true;
      }
      setSelected(sel)
      setLastSelection(index);
    } else {
    }
  };
  const onReorderTracks = (pl, idx, unk) => {
    console.debug('reorder %o', { pl, idx, unk });
  };
  const onDelete = (pl, sel) => {
    console.debug('delete %o', { pl, sel });
  };
  return (
    <div className="jookiPlaylist">
      <JookiPlaylistHeader playlist={playlist} />
      <JookiTrackList
        playlist={playlist}
        selected={selected}
        onReorderTracks={onReorderTracks}
      />
    </div>
  );
};
