import React from 'react';
import _ from 'lodash';
import { TrackList } from './TrackList';
import { ColumnBrowser } from './ColumnBrowser';
import * as COLUMNS from '../lib/columns';

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

export class TrackBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tracks: [],
      sorting: null,
      searched: [],
      filtered: [],
      filters: {
        genre: {},
        album: {},
        artist: {},
      },
      genres: [],
      albums: [],
      artists: [],
      cbHeight: 1,
      selected: {},
      totalWidth: 100,
      totalHeight: 100,
      columns: this.autosize([
        Object.assign({}, COLUMNS.CHECKED, { width: 1 }),
        Object.assign({}, COLUMNS.TRACK_TITLE, { width: 15 }),
        Object.assign({}, COLUMNS.TIME, { width: 3 }),
        Object.assign({}, COLUMNS.ARTIST, { width: 10 }),
        Object.assign({}, COLUMNS.ALBUM_TITLE, { width: 12 }),
        Object.assign({}, COLUMNS.GENRE, { width: 4 }),
        Object.assign({}, COLUMNS.RATING, { width: 4 }),
        Object.assign({}, COLUMNS.RELEASE_DATE, { width: 5 }),
        Object.assign({}, COLUMNS.DATE_ADDED, { width: 8 }),
        Object.assign({}, COLUMNS.PURCHASE_DATE, { width: 8 }),
        Object.assign({}, COLUMNS.DISC_NUMBER, { width: 3 }),
        Object.assign({}, COLUMNS.TRACK_NUMBER, { width: 3 }),
      ], 100),
    };
    this.resize = this.resize.bind(this);
    this.onSort = this.onSort.bind(this);
    this.onFilter = this.onFilter.bind(this);
    this.onTrackUp = this.onTrackUp.bind(this);
    this.onTrackDown = this.onTrackDown.bind(this);
    this.onTrackSelect = this.onTrackSelect.bind(this);
    this.onTrackPlay = this.onTrackPlay.bind(this);
    this.setTrackListContainer = this.setTrackListContainer.bind(this);
    this.setColumnBrowserContainer = this.setColumnBrowserContainer.bind(this);
    window.trackBrowser = this;
  }

  autosize(cols, w) {
    const sum = cols.reduce((acc, col) => acc + col.width, 0) || 1;
    const resized = cols.map(col => Object.assign({}, col, { width: col.width * w / sum }));
    return resized;
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resize, { passive: true });
    }
    this.updateTracks();
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resize, { passive: true });
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.playlist !== prevProps.playlist) {
      this.setState({ sorting: null });
    }
    if (this.props.tracks !== prevProps.tracks) {
      this.updateTracks();
    } else if (this.props.search !== prevProps.search) {
      this.searchTracks()
        .then(() => this.filterTracks());
    }
  }

  resize() {
    if (this.node) {
      const totalWidth = this.node.offsetWidth;
      const totalHeight = this.node.offsetHeight;
      if (totalWidth === this.state.totalWidth) {
        this.setState({ totalHeight });
      } else {
        this.setState({
          totalWidth,
          totalHeight, 
          columns: this.autosize(this.state.columns, totalWidth),
        });
      }
    }
  }

  updateTracks() {
    const tracks = this.state.tracks.slice(0);
    let tracksById = {};
    tracks.forEach((track, i) => {
      tracksById[track.persistent_id] = i;
    });
    this.props.tracks.forEach(track => {
      const idx = tracksById[track.persistent_id];
      if (idx !== null && idx !== undefined) {
        tracks[idx] = track;
      } else {
        tracks.push(track);
      }
    });
    return new Promise(resolve => this.setState({ tracks }, resolve))
      .then(() => this.sortTracks())
      .then(() => this.searchTracks())
      .then(() => this.filterTracks());
  }

  onSort(key) {
    let sorting = this.state.sorting;
    if (sorting === key) {
      sorting = `-${key}`;
    } else {
      sorting = key;
    }
    return new Promise(resolve => this.setState({ sorting }, resolve))
      .then(() => this.sortTracks(true))
      .then(() => this.searchTracks())
      .then(() => this.filterTracks());
  }

  onFilter(meta, kind, value) {
    let filters = Object.assign({}, this.state.filters);
    if (value === null || value === undefined || value === '') {
      filters[kind] = {};
    } else if (meta) {
      const vals = Object.assign({}, filters[kind]);
      if (vals[value]) {
        delete(vals[value]);
      } else {
        vals[value] = true;
      }
      filters[kind] = vals;
    } else {
      const vals = {};
      vals[value] = true;
      filters[kind] = vals;
    }
    return new Promise(resolve => this.setState({ filters }, resolve))
      .then(() => this.filterTracks());
  }

  sortTracks(resort) {
    let tracks = resort ? this.state.tracks.slice(0) : this.props.tracks.slice(0);
    let sorting = this.state.sorting;
    if (sorting === null || sorting === undefined || sorting === '') {
      // noop
    } else if (sorting.substr(0, 1) === '-') {
      sorting = sorting.substr(1);
      _.reverse(tracks);
      tracks = _.sortBy(tracks, [track => stringSorter(track[sorting])]);
      _.reverse(tracks);
    } else {
      tracks = _.sortBy(tracks, [track => stringSorter(track[sorting])]);
    }
    return new Promise(resolve => this.setState({ tracks }, resolve));
  }

  limitFilters(tracks, name) {
    //const genreSet = {};
    //const albumSet = {};
    //const artistSet = {};
    const filterSet = {};
    if (name === 'Genres') {
      tracks.forEach(track => {
        if (track.genre) {
          filterSet[track.genre] = true;
        }
      });
    } else if (name === 'Albums') {
      tracks.forEach(track => {
        if (track.album) {
          filterSet[track.album] = true;
        }
      });
    } else if (name === 'Artists') {
      tracks.forEach(track => {
        if (track.artist) {
          filterSet[track.artist] = true;
        }
        if (track.album_artist) {
          filterSet[track.album_artist] = true;
        }
        /*
        if (track.composer) {
          filterSet[track.composer] = true;
        }
        */
      });
    }
    const setToFilter = (set, name) => {
      const rows = _.sortBy(
          Object.keys(set).filter(v => !!v && v.trim() !== ''),
          [stringSorter]
        )
        .map(v => { return { name: v, val: v.toLowerCase() } });
      rows.unshift({ name: `All (${rows.length} ${name})`, val: null });
      return rows;
    };
    return setToFilter(filterSet, name);
  }

  searchTracks() {
    let searched;
    if (!this.props.search) {
      searched = this.state.tracks;
    } else {
      const query = new RegExp(this.props.search, 'i');
      const keys = [
        'name',
        'album',
        'artist',
        'album_artist',
        'composer',
      ];
      searched = this.state.tracks.filter(track => keys.some(key => (track[key] && track[key].match(query))));
    }
    //const genres = this.limitFilters(searched, 'Genres');
    //const albums = this.limitFilters(searched, 'Albums');
    //const artists = this.limitFilters(searched, 'Artists');
    return new Promise(resolve => this.setState({
      searched,
      //genres,
      //albums,
      //artists,
    }, resolve));
  }

  filterTracks() {
    let filtered = this.state.searched;
    const genres = this.limitFilters(filtered, 'Genres');
    filtered = this.filterTracksByItem(filtered, 'genre');
    const artists = this.limitFilters(filtered, 'Artists');
    filtered = this.filterTracksByItem(filtered, 'artist', ['artist', 'album_artist', 'composer']);
    const albums = this.limitFilters(filtered, 'Albums');
    filtered = this.filterTracksByItem(filtered, 'album');
    this.setState({ filtered, genres, albums, artists });
  }

  filterTracksByItem(tracks, kind, keys) {
    const xkeys = keys ? keys : [kind];
    const filts = {};
    let hasFilter = false;
    Object.keys(this.state.filters[kind]).filter(f => !!f).forEach(f => {
      hasFilter = true;
      filts[f.toLowerCase()] = true;
    });
    if (!hasFilter) {
      return tracks;
    }
    return tracks.filter(track => xkeys.some(key => track[key] && filts[track[key].toLowerCase()]));
  }

  onTrackUp(shiftKey) {
    if (shiftKey) {
      const start = this.state.lastSelection;
      const index = this.state.filtered.findIndex(track => track.persistent_id === start);
      if (index > 0) {
        const selected = Object.assign({}, this.state.selected);
        const pid = this.state.filtered[index - 1].persistent_id;
        selected[pid] = true;
        this.setState({ selected, lastSelection: pid });
      }
    } else {
      const indices = Object.keys(this.state.selected).map(pid => {
        return this.state.filtered.findIndex(track => track.persistent_id === pid);
      }).filter(pid => pid >= 0).sort();
      if (indices.length > 0 && indices[0] > 0) {
        const pid = this.state.filtered[indices[0]-1].persistent_id;
        const selected = {};
        selected[pid] = true;
        this.setState({ selected, lastSelection: pid });
      }
    }
  }

  onTrackDown(shiftKey) {
    if (shiftKey) {
      const start = this.state.lastSelection;
      const index = this.state.filtered.findIndex(track => track.persistent_id === start);
      if (index >= 0 && index < this.state.filtered.length - 1) {
        const selected = Object.assign({}, this.state.selected);
        const pid = this.state.filtered[index + 1].persistent_id;
        selected[pid] = true;
        this.setState({ selected, lastSelection: pid });
      }
    } else {
      const indices = Object.keys(this.state.selected).map(pid => {
        return this.state.filtered.findIndex(track => track.persistent_id === pid);
      }).filter(pid => pid >= 0).sort();
      const last = indices.length - 1;
      if (indices.length > 0 && indices[last] < this.state.filtered.length - 1) {
        const pid = this.state.filtered[indices[last]+1].persistent_id;
        const selected = {};
        selected[pid] = true;
        this.setState({ selected, lastSelection: pid });
      }
    }
  }

  onTrackSelect({ event, index, rowData }) {
    event.stopPropagation();
    event.preventDefault();
    const pid = this.state.filtered[index].persistent_id;
    console.debug('selecting %o', pid);
    if (event.metaKey) {
      const selected = Object.assign({}, this.state.selected);
      if (selected[pid]) {
        delete(selected[pid]);
      } else {
        selected[pid] = true;
      }
      this.setState({ selected, lastSelection: pid });
    } else if (event.shiftKey && this.state.lastSelection) {
      const prevIndex = this.state.filtered.findIndex(track => track.persistent_id === this.state.lastSelection);
      let group = [];
      if (prevIndex === -1) {
        console.debug('no previous selection');
        group = [pid];
      } else if (prevIndex < index) {
        console.debug('previous selection higher %o, %o', prevIndex, index);
        group = this.state.filtered.slice(prevIndex, index+1).map(track => track.persistent_id);
      } else {
        console.debug('previous selection lower %o, %o', prevIndex, index);
        group = this.state.filtered.slice(index, prevIndex+1).map(track => track.persistent_id);
      }
      const selected = Object.assign({}, this.state.selected);
      group.forEach(id => {
        selected[id] = true;
      });
      this.setState({ selected, lastSelection: pid });
    } else {
      const selected = {};
      selected[pid] = true;
      this.setState({ selected, lastSelection: pid });
    }
  }

  onTrackPlay({ event, index, rowData }) {
    console.debug('play %o', rowData);
  }

  setColumnBrowserContainer(node) {
    if (node && this.state.cbHeight <= 1) {
      const cbHeight = node.offsetHeight;
      this.setState({ cbHeight });
    }
  }

  setTrackListContainer(node) {
    if (node && !this.node) {
      this.node = node;
      this.resize();
    }
  }

  render() {
    return (
      <div className="trackBrowser">
        <div ref={this.setColumnBrowserContainer} className="columnBrowserContainer">
          <ColumnBrowser
            width={this.state.totalWidth*0.33}
            height={this.state.cbHeight}
            title="Genres"
            kind="genre"
            items={this.state.genres}
            selected={this.state.filters.genre}
            onClick={this.onFilter}
          />
          <ColumnBrowser
            width={this.state.totalWidth*0.34}
            height={this.state.cbHeight}
            title="Artists"
            kind="artist"
            items={this.state.artists}
            selected={this.state.filters.artist}
            onClick={this.onFilter}
          />
          <ColumnBrowser
            width={this.state.totalWidth*0.33}
            height={this.state.cbHeight}
            title="Albums"
            kind="album"
            items={this.state.albums}
            selected={this.state.filters.album}
            onClick={this.onFilter}
          />
        </div>
        <div ref={this.setTrackListContainer} className="trackListContainer">
          <TrackList
            totalWidth={this.state.totalWidth}
            totalHeight={this.state.totalHeight}
            list={this.state.filtered}
            columns={this.state.columns}
            selected={this.state.selected}
            playlist={this.props.playlist}
            onColumnResize={columns => this.setState({ columns })}
            onSort={this.onSort}
            onTrackUp={this.onTrackUp}
            onTrackDown={this.onTrackDown}
            onTrackSelect={this.onTrackSelect}
            onTrackPlay={this.props.onPlay}
            onReorderTracks={this.props.onReorderTracks}
            onDeleteTracks={this.props.onDeleteTracks}
            onConfirm={this.props.onConfirm}
          />
        </div>
      </div>
    );
  }
}

