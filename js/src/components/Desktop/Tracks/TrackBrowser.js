import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import _JSXStyle from "styled-jsx/style";
import { useMeasure } from '../../../lib/useMeasure';
import {
  TrackSelectionList,
  GENRE_FILTER,
  ARTIST_FILTER,
  ALBUM_FILTER
} from '../../../lib/trackList';
import { PlaylistHeader } from '../Playlists/PlaylistHeader';
import * as COLUMNS from '../../../lib/columns';
import { TrackList } from './TrackList';
import { ColumnBrowser } from './ColumnBrowser';

const tsl = new TrackSelectionList([], {});
window.tsl = tsl;

const defaultColumns = [
  Object.assign({}, COLUMNS.PLAYLIST_POSITION, { width: 100 /*1*/ }),
  Object.assign({}, COLUMNS.ALBUM_ARTIST,      { width: 11 /*1*/ }),
  Object.assign({}, COLUMNS.ALBUM_TITLE,       { width: 11 /*12*/ }),
  Object.assign({}, COLUMNS.DISC_NUMBER,       { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.TRACK_NUMBER,      { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.ARTIST,            { width: 11 /*10*/ }),
  Object.assign({}, COLUMNS.TRACK_TITLE,       { width: 11 /*15*/ }),
  Object.assign({}, COLUMNS.TIME,              { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.GENRE,             { width: 11 /*4*/ }),
  Object.assign({}, COLUMNS.RATING,            { width: 100 /*4*/ }),
  Object.assign({}, COLUMNS.RELEASE_DATE,      { width: 100 /*5*/ }),
  Object.assign({}, COLUMNS.DATE_ADDED,        { width: 100 /*8*/ }),
  Object.assign({}, COLUMNS.PURCHASE_DATE,     { width: 100 /*8*/ }),
  Object.assign({}, COLUMNS.EMPTY,             { width: 1 }),
];

const getDefaultSortKey = (playlist) => {
  const data = window.localStorage.getItem("defaultSort");
  if (data === null || data === undefined || data === '') {
    return 'origIndex';
  }
  const obj = JSON.parse(data);
  if (playlist) {
    const key = obj[playlist.persistent_id];
    if (key === null || key === undefined || key === '') {
      return 'origIndex';
    }
    return key;
  }
  const key = obj.library;
  if (key === null || key === undefined || key === '') {
    return '-date_added';
  }
  return key;
};

const setDefaultSortKey = (playlist, sortKey) => {
  console.debug('setDefaultSortKey(%o, %o)', playlist, sortKey);
  let data = window.localStorage.getItem('defaultSort');
  const obj = data ? JSON.parse(data) : {};
  if (playlist) {
    obj[playlist.persistent_id] = sortKey;
  } else {
    obj.library = sortKey;
  }
  data = JSON.stringify(obj);
  window.localStorage.setItem('defaultSort', data);
};

export const TrackBrowser = ({
  columnBrowser = false,
  columns = defaultColumns,
  tracks = [],
  playlist = null,
  search = null,
  onDelete,
  onReorder,
  controlAPI,
  onShowInfo,
  onShowMultiInfo,
}) => {
  const prevTracks = useRef(null);
  const [displayTracks, setDisplayTracks] = useState(tsl.tracks);
  const [selected, setSelected] = useState([]);
  const [cbWidth, cbHeight, setCBNode] = useMeasure(100, 1);

  const onPlay = useCallback(({ list, index }) => {
    console.debug('onPlay %o', { list, index, playlist, controlAPI });
    if (playlist) {
      if (controlAPI.onSetPlaylist) {
        const origIndex = tsl.displayTracks[index].origIndex;
        controlAPI.onSetPlaylist(playlist.persistent_id, origIndex);
      } else if (controlAPI.onReplaceQueue) {
        let tracks = [];
        if (list.length <= 1) {
          tracks = tsl.displayTracks.slice(index);
        } else {
          tracks = tsl.displayTracks.filter(tr => tr.selected);
        }
        controlAPI.onReplaceQueue(tracks.map(tr => tr.track));
      } else {
        console.debug('no way to play %o', { list, index, playlist, controlAPI });
      }
    } else if (controlAPI.onReplaceQueue) {
      let tracks = [];
      if (list.length <= 1) {
        tracks = tsl.displayTracks.slice(index, index + 100);
      } else {
        tracks = list.map(tr => tr.track);
        //tracks = tsl.displayTracks.filter(tr => tr.selected);
      }
      console.debug('onReplaceQueue(%o)', tracks);
      controlAPI.onReplaceQueue(tracks);
    } else {
      console.debug('no way to play %o', { list, index, playlist, controlAPI });
    }
  }, [controlAPI, playlist]);

  const update = useCallback(() => {
    setDisplayTracks(tsl.tracks);
    setSelected(tsl.selected);
  }, [setDisplayTracks, setSelected]);

  useEffect(() => {
    //console.debug('tracks updated: %o !== %o', tracks, prevTracks.current);
    console.debug('tracks updated: %o', playlist);
    prevTracks.current = tracks;
    tsl.setTracks(tracks);
    const sortKey = getDefaultSortKey(playlist);
    if (tsl.sortKey !== sortKey) {
      console.debug('sorting updated tracks (%o !== %o)', sortKey, tsl.sortKey);
      tsl.sort(sortKey);
    }
    update();
  }, [tracks, update, playlist]);

  useEffect(() => {
    tsl.onPlay = controlAPI.onPlay;
    tsl.onSkip = controlAPI.onSkipBy;
    //tsl.onDelete = controlAPI.onDelete;
  }, [controlAPI]);

  useEffect(() => {
    tsl.search(search);
    update();
  }, [search, update]);

  useEffect(() => {
    if (playlist === null) {
      tsl.onDelete = null;
    } else {
      tsl.onDelete = (sel) => {
        return onDelete({ ...playlist, tracks, items: tracks }, sel);
      };
    }
  }, [onDelete, tracks, playlist]);

  const onSort = useCallback((key) => {
    console.debug('onSort(%o)', key);
    tsl.sort(key);
    setDefaultSortKey(playlist, tsl.sortKey);
    setDisplayTracks(tsl.tracks);
  }, [setDisplayTracks, playlist]);

  const onClick = useCallback((event, index) => {
    const mods = { shift: event.shiftKey, meta: event.metaKey };
    console.debug('onClick: tsl = %o, index: %o, mods: %o', tsl, index, mods);
    if (tsl.onTrackClick(index, mods)) {
      //event.stopPropagation();
      //event.preventDefault();
      setDisplayTracks(tsl.tracks);
      setSelected(tsl.selected);
    }
  }, [setDisplayTracks, setSelected]);

  const onKeyPress = useCallback((event) => {
    const mods = { shift: event.shiftKey, meta: event.metaKey };
    if ((event.metaKey || event.ctrlKey) && (event.key === 'i' || event.key === 'I')) {
      if (tsl.selected && tsl.selected.length > 1) {
        if (event.shiftKey) {
          onShowMultiInfo(tsl.selected.map(tr => tr.track));
        } else {
          onShowInfo(tsl.selected.map(tr => tr.track), 0);
        }
      } else {
        const tracks = tsl.tracks.map(tr => tr.track);
        if (tsl.selected && tsl.selected.length > 0) {
          console.debug(tsl.selected);
          if (event.shiftKey) {
            onShowMultiInfo(tracks);
          } else {
            const idx = tsl.tracks.findIndex(tr => tr.index === tsl.selected[0].index);
            onShowInfo(tracks, idx);
          }
        } else {
          if (event.shiftKey) {
            onShowMultiInfo(tracks);
          } else {
            onShowInfo(tracks, 0);
          }
        }
      }
    } else if (tsl.onTrackKeyPress(event.code, mods)) {
      event.stopPropagation();
      event.preventDefault();
      setDisplayTracks(tsl.tracks);
      setSelected(tsl.selected);
    }
  }, [setDisplayTracks, setSelected, onShowInfo, onShowMultiInfo]);

  const genres = tsl.genres;
  const artists = tsl.artists;
  const albums = tsl.albums;

  const colBrowsers = useMemo(() => {
    return [
      ['Genres',  genres,  GENRE_FILTER],
      ['Artists', artists, ARTIST_FILTER],
      ['Albums',  albums,  ALBUM_FILTER],
    ].map(([name, key, f]) => ({
      name: name,
      rows: key,
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
        if (tsl.onFilterKeyPress(f, event.code, mods)) {
          event.stopPropagation();
          event.preventDefault();
          //event.target.focus();
          update();
        }
      },
    }));
  }, [update, genres, artists, albums]);

  return (
    <div className="trackBrowser">
      { playlist && (<PlaylistHeader playlist={playlist} controlAPI={controlAPI} />) }
      { columnBrowser && !playlist ? (
        <div ref={setCBNode} className="columnBrowserContainer">
          { colBrowsers.map((cb, i) => (
            <ColumnBrowser
              key={cb.name}
              tabIndex={i + 2}
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
        onShowInfo={onShowInfo}
      />
      <style jsx>{`
        .trackBrowser {
          flex: 100;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .trackBrowser .columnBrowserContainer {
          border-bottom-color: var(--border);
        }
        .trackBrowser :global(.ReactVirtualized__Table__headerRow:focus),
        .trackBrowser :global(.ReactVirtualized__Table__row:focus) {
          outline: none;
        }
        .trackBrowser :global(.ReactVirtualized__Table__headerRow) {
          font-size: 12px;
          text-transform: none;
          white-space: nowrap;
          border-bottom-style: solid;
          border-bottom-width: 1px;
        }
        .trackBrowser :global(.ReactVirtualized__Table__headerColumn) {
          display: flex;
          flex-direction: row;
          justify-content: center;
          border-right-style: solid;
          border-right-width: 1px;
          cursor: default;
          user-select: none;
          box-sizing: border-box;
          padding-left: 0.25em;
          padding-right: 0.25em;
        }
        .trackBrowser :global(.ReactVirtualized__Table__rowColumn) {
          font-size: 12px;
          padding-right: 10px;
          box-sizing: border-box;
          cursor: default;
          user-select: none;
        }
        .trackBrowser :global(.ReactVirtualized__Table__headerTruncatedText) {
          flex: auto;
        }
        .columnBrowserContainer {
          flex: 1;
          min-height: 200px;
          display: flex;
          flex-direction: row;
          border-top: none;
          border-bottom-style: solid;
          border-bottom-width: 1px;
        }
      `}</style>
    </div>
  );
};
