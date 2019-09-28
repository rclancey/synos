import React, { useState, useEffect } from 'react';
import { TrackSelectionList, GENRE_FILTER, ARTIST_FILTER, ALBUM_FILTER } from '../lib/trackList';
import { TrackList } from './TrackList2';
import { ColumnBrowser } from './ColumnBrowser';
import * as COLUMNS from '../lib/columns';
import { useMeasure } from '../lib/useMeasure';

const tsl = new TrackSelectionList([], {});
window.tsl = tsl;

const defaultColumns = [
  Object.assign({}, COLUMNS.PLAYLIST_POSITION, { width: 100 /*1*/ }),
  Object.assign({}, COLUMNS.TRACK_TITLE,       { width: 11 /*15*/ }),
  Object.assign({}, COLUMNS.TIME,              { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.ARTIST,            { width: 11 /*10*/ }),
  Object.assign({}, COLUMNS.ALBUM_TITLE,       { width: 11 /*12*/ }),
  Object.assign({}, COLUMNS.GENRE,             { width: 11 /*4*/ }),
  Object.assign({}, COLUMNS.RATING,            { width: 100 /*4*/ }),
  Object.assign({}, COLUMNS.RELEASE_DATE,      { width: 100 /*5*/ }),
  Object.assign({}, COLUMNS.DATE_ADDED,        { width: 100 /*8*/ }),
  Object.assign({}, COLUMNS.PURCHASE_DATE,     { width: 100 /*8*/ }),
  Object.assign({}, COLUMNS.DISC_NUMBER,       { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.TRACK_NUMBER,      { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.EMPTY,             { width: 1 }),
];

export const TrackBrowser = ({
  columnBrowser = false,
  columns = defaultColumns,
  tracks = [],
  playlist = null,
  search = null,
  onPlay,
  onSkip,
  onDelete,
  onReorder,
}) => {
  const [displayTracks, setDisplayTracks] = useState(tsl.tracks);
  const [selected, setSelected] = useState([]);
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [cbWidth, cbHeight, setCBNode] = useMeasure(100, 1);

  const update = () => {
    setDisplayTracks(tsl.tracks);
    setSelected(tsl.selected);
    setGenres(tsl.genres);
    setArtists(tsl.artists);
    setAlbums(tsl.albums);
  };
  useEffect(() => {
    console.debug('updating tracks');
    tsl.setTracks(tracks);
    update();
  }, [tracks]);
  useEffect(() => {
    console.debug('updating handlers');
    tsl.onPlay = onPlay;
    tsl.onSkip = onSkip;
    tsl.onDelete = onDelete;
  }, [onPlay, onSkip, onDelete]);
  useEffect(() => {
    console.debug('updating tsl search to %o', search);
    tsl.search(search);
    update();
  }, [search]);

  const onSort = (key) => {
    tsl.sort(key);
    setDisplayTracks(tsl.tracks);
  };
  const onClick = (event, index) => {
    const mods = { shift: event.shiftKey, meta: event.metaKey };
    if (tsl.onTrackClick(index, mods)) {
      //event.stopPropagation();
      //event.preventDefault();
      setDisplayTracks(tsl.tracks);
      setSelected(tsl.selected);
    }
  };
  const onKeyPress = (event) => {
    const mods = { shift: event.shiftKey, meta: event.metaKey };
    if (tsl.onTrackKeyPress(event.code, mods)) {
      event.stopPropagation();
      event.preventDefault();
      setDisplayTracks(tsl.tracks);
      setSelected(tsl.selected);
    }
  };

  const colBrowsers = [
    ['Genres',  'genres',  GENRE_FILTER],
    ['Artists', 'artists', ARTIST_FILTER],
    ['Albums',  'albums',  ALBUM_FILTER],
  ].map(([name, key, f]) => ({
    name: name,
    rows: tsl[key],
    lastIndex: tsl.lastFilterIndex[f],
    onClick: (event, index) => {
      const mods = { shift: event.shiftKey, meta: event.metaKey };
      if (tsl.onFilterClick(f, index, mods)) {
        event.stopPropagation();
        event.preventDefault();
        update();
      }
    },
    onKeyPress: (event) => {
      const mods = { shift: event.shiftKey, meta: event.metaKey, chr: event.key };
      console.debug('key press event: %o', event);
      if (tsl.onFilterKeyPress(f, event.code, mods)) {
        event.stopPropagation();
        event.preventDefault();
        event.target.focus();
        update();
      }
    },
  }));

  return (
    <div className="trackBrowser">
      { columnBrowser ? (
        <div ref={setCBNode} className="columnBrowserContainer">
          { colBrowsers.map(cb => (
            <ColumnBrowser
              key={cb.name}
              title={cb.name}
              items={cb.rows}
              width={Math.floor(cbWidth / 3) - 1}
              height={cbHeight}
              lastIndex={cb.lastIndex}
              onClick={cb.onClick}
              onKeyPress={cb.onKeyPress}
            />
          )) }
        </div>
      ) : null }
      <TrackList
        columns={columns}
        tracks={displayTracks}
        playlist={playlist}
        selected={selected}
        onSort={onSort}
        onClick={onClick}
        onKeyPress={onKeyPress}
        onPlay={onPlay}
        onReorder={onReorder}
        onDelete={onDelete}
      />
    </div>
  );
};
