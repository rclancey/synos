import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
//import { List, AutoSizer } from "react-virtualized";
import { Album } from './SongList';

export class AlbumList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollTop: 0,
      albums: [],
      index: [],
      album: null,
    };
    this.onClose = this.onClose.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.onScroll = this.onScroll.bind(this);
  }

  componentDidMount() {
    this.loadAlbums();
  }

  componentDidUpdate(prevProps) {
    if (this.props.artist !== prevProps.artist) {
      this.loadArtists();
    }
  }

  loadAlbums() {
    let url = '/api/index/';
    if (this.props.artist) {
      url += `albums?artist=${escape(this.props.artist.sort)}`;
    } else {
      url += 'album-artist';
    }
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(albums => {
        albums.forEach(album => {
          album.name = Object.keys(album.names).sort((a, b) => album.names[a] < album.names[b] ? 1 : album.names[a] > album.names[b] ? -1 : 0)[0];
          album.artist.name = Object.keys(album.artist.names).sort((a, b) => album.artist.names[a] < album.artist.names[b] ? 1 : album.artist.names[a] > album.artist.names[b] ? -1 : 0)[0];
        });
        if (this.props.artist) {
          albums.sort((a, b) => a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0)
        }
        const index = this.makeIndex(albums || []);
        this.setState({ albums, index });
      });
  }

  makeIndex(albums) {
    const index = [];
    let prev = null;
    albums.forEach((album, i) => {
      let first = (this.props.artist ? album : album.artist).sort.substr(0, 1);
      if (!first.match(/^[a-z]/)) {
        first = '#';
      }
      if (prev !== first) {
        const n = prev ? prev.charCodeAt(0) + 1 : 'a'.charCodeAt(0);
        const m = first === '#' ? 'z'.charCodeAt(0) : first.charCodeAt(0) - 1;
        for (let j = n; j <= m; j++) {
          index.push({ name: String.fromCharCode(j).toUpperCase(), scrollTop: -1 });
        }
        index.push({ name: first.toUpperCase(), scrollTop: Math.floor(i / 2) * 195 });
        prev = first;
      }
    });
    return index;
  }

  onOpen(album) {
    this.setState({ album });
  }

  onClose() {
    if (this.state.album === null) {
      this.props.onClose();
    } else {
      this.setState({ album: null });
    }
  }

  coverArtUrl(album) {
    let url = '/api/art/album?';
    if (album) {
      url += `artist=${escape(album.artist.sort)}`;
    } else if (this.props.artist) {
      url += `artist=${escape(this.props.artist.sort)}`;
    }
    url += `&album=${escape(album.sort)}`;
    return `url(${url})`;
    //return `url(/api/art/album?artist=${escape(this.props.artist)}&album=${escape(album)})`;
  }

  onScroll({ scrollTop }) {
    this.setState({ scrollTop });
  }

  rowRenderer({ key, index, style }) {
    const album1 = this.state.albums[index * 2];
    const album2 = this.state.albums[index * 2 + 1];
    return (
      <div key={key} className="row" style={style}>
        <div className="padding" />
        <div className="item" onClick={() => this.onOpen(album1)}>
          <div className="coverArt" style={{backgroundImage: this.coverArtUrl(album1)}} />
          <div className="title">{album1.name}</div>
        </div>
        <div className="padding" />
        { album2 ? (
          <div className="item" onClick={() => this.onOpen(album2)}>
            <div className="coverArt" style={{backgroundImage: this.coverArtUrl(album2)}} />
            <div className="title">{album2.name}</div>
          </div>
        ) : (
          <div className="item" />
        ) }
        <div className="padding" />
      </div>
    );
  }

  render() {
    if (this.state.album !== null) {
      console.debug('rendering album %o', this.state.album);
      return (
        <Album
          prev={this.props.artist || { name: "Albums"}}
          artist={this.props.artist || this.state.album.artist}
          album={this.state.album}
          onClose={this.onClose}
          onTrackMenu={this.props.onTrackMenu}
          onPlaylistMenu={this.props.onPlaylistMenu}
        />
      );
    }
    return (
      <div className="albumList">
        <div className="back" onClick={this.onClose}>{this.props.prev}</div>
        <div className="header">
          <div className="title">{this.props.artist ? this.props.artist.name : "Albums"}</div>
        </div>
        <div className="index">
          {this.state.index.map(idx => (
            <div key={idx.name} className={idx.scrollTop < 0 ? 'disabled' : ''} onClick={() => idx.scrollTop >= 0 && this.ref.scrollTo(idx.scrollTop)}>{idx.name}</div>
          ))}
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                ref={ref => this.ref = ref}
                width={width}
                height={height}
                itemCount={Math.ceil(this.state.albums.length / 2)}
                itemSize={195}
                overscanCount={Math.ceil(height / 195)}
                initialScrollOffset={this.state.scrollTop}
                onScroll={this.onScroll}
              >
                {this.rowRenderer}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
}
