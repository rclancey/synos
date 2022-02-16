import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as COLUMNS from './columns';
import cmp from './cmp';

const defaultColumns = [
  COLUMNS.PLAYLIST_POSITION,
  COLUMNS.ALBUM_ARTIST,
  COLUMNS.ALBUM_TITLE,
  COLUMNS.DISC_NUMBER,
  COLUMNS.TRACK_NUMBER,
  COLUMNS.ARTIST,
  COLUMNS.TRACK_TITLE,
  COLUMNS.TIME,
  COLUMNS.GENRE,
  COLUMNS.RATING,
  COLUMNS.RELEASE_DATE,
  COLUMNS.DATE_ADDED,
  COLUMNS.PURCHASE_DATE,
];

const colMap = new Map(Object.entries(COLUMNS).filter(([key, data]) => data.key).map(([key, data]) => ([data.key, key])));

const getPrefsKey = (playlistId) => {
  let key = 'playlist-columns';
  if (playlistId) {
    key += `-${playlistId}`;
  }
  return key;
};

console.debug('colMap = %o', colMap);

export const usePlaylistColumns = (playlistId) => {
  const [counter, setCounter] = useState(0);
  const cols = useMemo(() => {
    if (typeof window === 'undefined' || window.localStorage === undefined) {
      console.debug('no local storage');
      return defaultColumns;
    }
    window.debugCOLUMNS = COLUMNS;
    const prefsJson = window.localStorage.getItem(getPrefsKey(playlistId));
    if (!prefsJson) {
      return defaultColumns;
    }
    const prefs = JSON.parse(prefsJson);
    return prefs.filter((col) => COLUMNS[col.key])
      .map((col) => Object.assign({}, COLUMNS[col.key], { width: col.width }));
  }, [playlistId, counter]);
  const width = useMemo(() => {
    return cols.reduce((w, col) => w + col.width, 0);
  }, [cols]);
  const avail = useMemo(() => {
    const on = new Set(cols.map((col) => col.key));
    return Object.values(COLUMNS)
      .filter((col) => col.key)
      .map((col) => ({ key: col.key, label: col.label, selected: on.has(col.key) }))
      .sort((a, b) => cmp(a.label, b.label));
  }, [cols]);
  const onUpdate = useCallback((newCols) => {
    console.debug('onUpdate(%o)', newCols);
    if (typeof window === 'undefined' || window.localStorage === undefined) {
      console.debug('no local storage');
      return;
    }
    const prefs = newCols.map((col) => ({ key: colMap.get(col.key), width: col.width }));
    window.localStorage.setItem(getPrefsKey(playlistId), JSON.stringify(prefs));
    setCounter((orig) => orig + 1);
  }, [playlistId]);
  const onToggle = useCallback((colKey) => {
    console.debug('onToggle(%o)', colKey);
    const hasCol = cols.some((col) => col.key === colKey);
    if (hasCol) {
      console.debug('removing %o from %o', colKey, cols);
      onUpdate(cols.filter((col) => col.key !== colKey));
    } else {
      const col = COLUMNS[colMap.get(colKey)];
      if (!col) {
        console.debug('colKey %o (%o) not found in %o / %o', colKey, colMap.get(colKey), colMap, COLUMNS);
        return;
      }
      onUpdate(cols.concat([Object.assign({}, col, { width: col.minWidth || 50 })]));
    }
  }, [cols, onUpdate]);
  const onResize = useCallback((colKey, delta) => {
    console.debug('resize col %o by %o', colKey, delta);
    const newCols = cols.map((col) => {
      if (col.key === colKey) {
        const w = col.width + delta;
        const minWidth = Math.max(10, col.minWidth || 0);
        if (w < minWidth) {
          return { ...col, width: minWidth };
        }
        if (col.maxWidth && w > col.maxWidth) {
          return { ...col, width: col.maxWidth };
        }
        return { ...col, width: w };
      }
      return col;
    });
    onUpdate(newCols);
  }, [cols, onUpdate]);
  const onMove = useCallback((colKey, x) => {
    console.debug('move col %o to %o (based on %o)', colKey, x, cols);
    let colX = 0;
    const withX = cols.map((col, i) => {
      const x = colX + col.width / 2;
      colX += col.width;
      return { ...col, x, i };
    });
    const xcol = withX.find((col) => col.key === colKey);
    if (!xcol) {
      return;
    }
    const before = withX.filter((col) => col.key !== colKey && col.x < xcol.x + x);
    const after = withX.filter((col) => col.key !== colKey && col.x >= xcol.x + x);
    console.debug('moving %o to %o (%o)', xcol, before.length, withX);
    onUpdate(before.concat([xcol]).concat(after));
  }, [cols, onUpdate]);
  const ref = useMemo(() => ({
    cols,
    width,
    avail,
    onUpdate,
    onToggle,
    onResize,
    onMove,
  }), [cols, width, avail, onUpdate, onToggle, onResize, onMove]);
  return ref;
};
