import sortBy from 'lodash.sortBy';

const setsEqual = (a, b) => {
  if (a.size !== b.size) {
    return false;
  }
  return Array.from(a).every(k => b.has(k));
};

const stringSorter = v => {
  if (v === null || v === undefined) {
    return '';
  }
  if (typeof v !== 'string') {
    return v;
  }
  let x = v.toLowerCase();
  x = x.replace(/^(a|an|the) /, '');
  x = x.replace(/^[^a-z0-9]+/, '');
  //x = x.replace(/^ +/, '');
  x = x.replace(/ +/, ' ');
  x = x.replace(/^(a|an|the) /, '');
  x = x.replace(/([0-9]+)/g, '~$1');
  return x;
};

export const SEARCH_FILTER = 1;
export const GENRE_FILTER  = 2;
export const ARTIST_FILTER = 4;
export const ALBUM_FILTER  = 8;

const filterKeys = {
  [SEARCH_FILTER]: ['name', 'album', 'artist', 'album_artist', 'composer'],
  [GENRE_FILTER]:  ['genre'],
  [ARTIST_FILTER]: ['artist', 'album_artist', 'composer'],
  [ALBUM_FILTER]:  ['album'],
};

const filterValues = {
  [GENRE_FILTER]:  ['genre'],
  [ARTIST_FILTER]: ['artist', 'album_artist'],
  [ALBUM_FILTER]:  ['album'],
};

const filterNames = {
  [SEARCH_FILTER]: ['Search', 'Search'],
  [GENRE_FILTER]:  ['Genre',  'Genres'],
  [ARTIST_FILTER]: ['Artist', 'Artists'],
  [ALBUM_FILTER]:  ['Album',  'Albums'],
};

export class TrackSelectionList {
  constructor(tracks, { onPlay, onDelete, onSkip }) {
    this.lastSelectedTrack = -1;
    this.lastSelectedFilter = {
      [GENRE_FILTER]:  null,
      [ARTIST_FILTER]: null,
      [ALBUM_FILTER]:  null,
    };
    this.appliedFilters = {
      [SEARCH_FILTER]: new Set(),
      [GENRE_FILTER]:  new Set(),
      [ARTIST_FILTER]: new Set(),
      [ALBUM_FILTER]:  new Set(),
    };
    this.lastFilterIndex = {
      [SEARCH_FILTER]: -1,
      [GENRE_FILTER]:  -1,
      [ARTIST_FILTER]: -1,
      [ALBUM_FILTER]:  -1,
    };
    this._typing = '';
    this._clearTyping = null;
    this._sortKey = null;
    this._reversed = false;
    this.onPlay = onPlay;
    this.onDelete = onDelete;
    this.onSkip = onSkip;
    this.allTracks = tracks;
  }

  wrap(track, index) {
    return {
      index: index,
      filtered: 0,
      selected: 0,
      track: Object.assign({}, track, { origIndex: index }),
    };
  }

  setTracks(tracks) {
    //console.debug('setting tracks');
    this.allTracks = tracks.map((track, index) => this.wrap(track, index));
    const sk = this.sortKey;
    this._sortKey = null;
    this._reversed = null;
    //console.debug('sorting tracks');
    this.sort(sk);
    const applied = this.appliedFilters;
    this.appliedFilters = {
      [SEARCH_FILTER]: new Set(),
      [GENRE_FILTER]:  new Set(),
      [ARTIST_FILTER]: new Set(),
      [ALBUM_FILTER]:  new Set(),
    };
    [SEARCH_FILTER, GENRE_FILTER, ARTIST_FILTER, ALBUM_FILTER].forEach(f => {
      //console.debug('filtering tracks with %o %o', f, Array.from(applied[f]));
      this.allTracks = this.applyFilter(f, Array.from(applied[f]));
    });
    this.allTracks = this.allTracks.slice(0);
  }

  get allTracks() {
    return this._allTracks;
  }

  set allTracks(tracks) {
    if (this._allTracks === tracks) {
      //console.debug('no change to allTracks');
      return;
    }
    //console.debug('updating tracks');
    this._allTracks = tracks.map((tr, i) => Object.assign({}, tr, { index: i }));;
    //console.debug('filtering tracks');
    this.tracks = this._allTracks.filter(tr => tr.filtered === 0);
    //console.debug('setting display tracks');
    this.displayTracks = this.tracks.map(tr => tr.track);
    //console.error('updated tracks to %o, %o items', this.tracks.length, this.displayTracks.length);
    this.genres = this.filters(GENRE_FILTER);
    this.artists = this.filters(ARTIST_FILTER);
    this.albums = this.filters(ALBUM_FILTER);
  }

  setToFilter(f, s) {
    const sel = this.appliedFilters[f];
    const rows = sortBy(
      Array.from(s).filter(v => !!v && v.trim() !== ''),
      [stringSorter],
    )
      .map(v => ({ name: v, val: v.toLowerCase(), selected: sel.has(v.toLowerCase()) }));
    const name = rows.length === 1 ? filterNames[f][0] : filterNames[f][1];
    rows.unshift({ name: `All (${rows.length} ${name})`, val: null, selected: sel.size === 0 });
    return rows;
  }

  filters(f, name) {
    let mask = 0;
    for (let i = 1; i < f; i *= 2) {
      mask = mask | i;
    }
    const s = new Set();
    this.allTracks.filter(track => (track.filtered & mask) === 0)
      .forEach(track => filterValues[f].forEach(k => s.add(track.track[k])));
    return this.setToFilter(f, s);
  }

  filterTrack(track, filter, on) {
    const mask = 0xffff ^ filter;
    const filtered = (track.filtered & mask) | (on ? filter : 0);
    return Object.assign({}, track, { filtered });
  }

  search(query) {
    this.allTracks = this.applyFilter(SEARCH_FILTER, [query]);
  }

  filterGenre(values) {
    this.allTracks = this.applyFilter(GENRE_FILTER, values);
  }

  filterArtist(values) {
    this.allTracks = this.applyFilter(ARTIST_FILTER, values);
  }

  filterAlbum(values) {
    this.allTracks = this.applyFilter(ALBUM_FILTER, values);
  }

  applySearch(query) {
    const words = query.toLowerCase().split(/\s+/);
    return this.allTracks.map(track => {
      const f = words.every(word => filterKeys[SEARCH_FILTER].some(key => track.track[key] && track.track[key].toLowerCase().includes(word)));
      return this.filterTrack(track, SEARCH_FILTER, !f);
    });
  }

  applyFilter(filter, values) {
    const filts = new Set();
    (values || []).filter(f => !!f).forEach(f => {
      filts.add(f.toLowerCase());
    });
    if (setsEqual(this.appliedFilters[filter], filts)) {
      return this.allTracks;
    }
    this.appliedFilters[filter] = filts;
    //console.error('applyFilter(%o, %o)', filter, filts);
    if (filts.size === 0) {
      return this.allTracks.map(track => this.filterTrack(track, filter, false));
    }
    if (filter === SEARCH_FILTER) {
      return this.applySearch(Array.from(filts)[0]);
    }
    return this.allTracks.map(track => {
      const f = filterKeys[filter].some(key => track.track[key] && filts.has(track.track[key].toLowerCase()));
      return this.filterTrack(track, filter, !f);
    });
  }

  sort(key) {
    if (key === null) {
      //console.debug('no sort key');
      return;
    }
    let rev = null;
    if (key.startsWith('-')) {
      rev = true;
      key = key.substr(1);
    } else if (key.startsWith('+')) {
      rev = false;
      key = key.substr(1);
    }
    if (this._sortKey === key) {
      if (rev && this._reversed) {
        //console.debug('already sorted %o/%o', key, rev);
        return;
      }
      if (rev !== null && !this._reversed) {
        //console.debug('already sorted %o/%o', key, rev);
        return;
      }
      //console.debug('already sorted, reversing');
      this._reversed = !this._reversed;
      return this.reverse();
    }
    const skey = key === null ? 'origIndex' : key;
    //console.debug('sortBy(%o)', skey);
    this.allTracks = sortBy(this.allTracks, [track => stringSorter(track.track[skey])])
      .map((track, index) => Object.assign({}, track, { index }));
    this._sortKey = key === 'origIndex' ? null : key;
    if (rev) {
      //console.debug('reversing');
      this._reversed = true;
      this.reverse();
    } else {
      this._reversed = false;
    }
  }

  reverse() {
    this.allTracks = this.allTracks.slice().reverse()
  }

  get sortKey() {
    const skey = this._sortKey === null ? 'origIndex' : this._sortKey;
    if (this._reversed) {
      return `-${skey}`;
    }
    return `+${skey}`;
  }

  onTrackClick(index, { shift = false, meta = false }) {
    if (index < 0) {
      return false;
    }
    const track = this.tracks[index];
    if (!track) {
      return false;
    }
    let tracks = this.allTracks.slice();
    if (meta) {
      tracks[track.index] = Object.assign({}, track, { selected: !track.selected });
      this.allTracks = tracks;
      this.lastSelectedTrack = track.track.origIndex;
      return true;
    }
    if (shift) {
      const last = this.tracks.find(tr => tr.track.origIndex === this.lastSelectedTrack);
      let start, end;
      if (last) {
        start = Math.min(last.index, track.index);
        end = Math.max(last.index, track.index);
      } else {
        start = track.index;
        end = track.index;
      }
      for (let i = start; i <= end; i++) {
        if (tracks[i].filtered === 0) {
          if (!tracks[i].selected) {
            tracks[i] = Object.assign({}, tracks[i], { selected: true });
          }
        }
      }
      this.allTracks = tracks;
      this.lastSelectedTrack = track.track.origIndex;
      return true;
    }
    this.lastSelectedTrack = track.track.origIndex;
    if (track.selected) {
      return true;
    }
    tracks = tracks.map(tr => {
      if (tr.selected) {
        return Object.assign({}, tr, { selected: false });
      }
      return tr;
    });
    tracks[track.index] = Object.assign({}, track, { selected: true });
    this.allTracks = tracks;
    return true;
  }

  onTrackKeyPress(key, { shift = false, meta = false }) {
    if (meta && key === 'KeyA') {
      if (shift) {
        this.allTracks = this.allTracks.map(tr => {
          if (tr.selected) {
            return Object.assign({}, tr, { selected: false });
          }
          return tr;
        });
      } else {
        this.allTracks = this.allTracks.map(tr => {
          const selected = tr.filtered === 0 ? true : false;
          if (tr.selected !== selected) {
            return Object.assign({}, tr, { selected });
          }
          return tr;
        });
      }
    }
    if (key === 'Enter') {
      if (this.onPlay) {
        let sel = this.selected;
        if (sel.length === 0) {
          sel = this.tracks.slice();
        }
        this.onPlay({ list: sel.map(tr => tr.track), index: 0 });
        return true;
      }
      return false;
    }
    if (key === 'Delete' || key === 'Backspace') {
      if (this.onDelete) {
        let sel = this.selected;
        if (sel.length === 0) {
          return false;
        }
        this.onDelete(sel)
          .then(() => {
            const del = new Set(sel.map(tr => tr.track.origIndex));
            this.allTracks = this.allTracks.filter(tr => !del.has(tr.track.origIndex));
          });
        return true;
      }
      return false;
    }
    if (key === 'ArrowRight') {
      if (this.onSkip) {
        this.onSkip(1);
        return true;
      }
      return false;
    }
    if (key === 'ArrowLeft') {
      if (this.onSkip) {
        this.onSkip(-1);
        return true;
      }
      return false;
    }
    const lastIdx = this.tracks.findIndex(tr => tr.track.origIndex === this.lastSelectedTrack);
    if (lastIdx === -1) {
      return false;
    }
    if (key === 'ArrowDown') {
      return this.onTrackClick(lastIdx + 1, { shift });
    } else if (key === 'ArrowUp') {
      return this.onTrackClick(lastIdx - 1, { shift });
    }
    return false;
  }

  onFilterClick(filter, index, { shift = false, meta = false }) {
    const startTime = Date.now();
    if (index < 0) {
      return false;
    }
    if (index === 0) {
      this.allTracks = this.applyFilter(filter, []);
      this.lastSelectedFilter[filter] = null;
    }
    const lastFilter = this.lastSelectedFilter[filter];
    const all = this.filters(filter);
    const f = all[index];
    if (!f) {
      return false;
    }
    this.lastFilterIndex[filter] = index;
    const fs = new Set(this.appliedFilters[filter]);
    if (f.val === null) {
      fs.clear();
    } else {
      if (meta) {
        if (fs.has(f.val)) {
          fs.delete(f.val);
        } else {
          fs.add(f.val);
        }
      } else if (shift) {
        const lastIdx = lastFilter ? all.findIndex(x => x.val === lastFilter) : -1;
        let start, end;
        if (lastIdx === -1) {
          start = index;
          end = index;
        } else {
          start = Math.min(lastIdx, index);
          end = Math.max(lastIdx, index);
        }
        for (let i = start; i <= end; i++) {
          fs.add(all[i].val);
        }
      } else {
        fs.clear();
        fs.add(f.val);
      }
    }
    console.debug('configuring filter took %o ms', Date.now() - startTime);
    this.lastSelectedFilter[filter] = f.val;
    this.allTracks = this.applyFilter(filter, Array.from(fs));
    console.debug('filtering took %o ms', Date.now() - startTime);
    return true;
  }

  onFilterKeyPress(filter, key, { shift = false, meta = false, chr = null }) {
    if (this._clearTyping !== null) {
      clearTimeout(this._clearTyping);
      this._clearTyping = null;
    }
    if (meta && key === 'KeyA') {
      this._typing = '';
      return this.onFilterClick(filter, 0);
    }
    const all = this.filters(filter);
    const lastFilter = this.lastSelectedFilter[filter];
    const lastIdx = all.findIndex(x => x.val === lastFilter);
    if (lastIdx === -1) {
      return;
    }
    if (key === 'ArrowDown') {
      this._typing = '';
      return this.onFilterClick(filter, lastIdx + 1, { shift });
    } else if (key === 'ArrowUp') {
      this._typing = '';
      return this.onFilterClick(filter, lastIdx - 1, { shift });
    } else if (!meta && chr && chr.length === 1) {
      console.debug('typing: %o', { key, chr });
      this._typing += chr.toLowerCase();
      this._clearTyping = setTimeout(() => {
        this._clearTyping = null;
        this._typing = '';
      }, 500);
      const idx = all.findIndex(x => x.val && x.val.startsWith(this._typing));
      return this.onFilterClick(filter, idx, {});
    }
    return false;
  }

  get selected() {
    return this.tracks.filter(tr => tr.selected);
  }

};
