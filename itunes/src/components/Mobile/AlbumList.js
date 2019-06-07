import React from 'react';
import { List, AutoSizer } from "react-virtualized";
import { Album } from './SongList';

export class AlbumList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollTop: 0,
      albums: [],
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
      url += `albums?artist=${escape(this.props.artist)}`;
    } else {
      url += 'album-artist';
    }
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(albums => this.setState({ albums }));
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
    if (album[0]) {
      url += `artist=${escape(album[0])}`;
    } else if (this.props.artist) {
      url += `artist=${escape(this.props.artist)}`;
    }
    url += `&album=${escape(album[1])}`;
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
          <div className="title">{album1[1]}</div>
        </div>
        <div className="padding" />
        { album2 ? (
          <div className="item" onClick={() => this.onOpen(album2)}>
            <div className="coverArt" style={{backgroundImage: this.coverArtUrl(album2)}} />
            <div className="title">{album2[1]}</div>
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
      return (
        <Album
          prev={this.props.artist || "Albums"}
          artist={this.props.artist || this.state.album[0]}
          album={this.state.album[1]}
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
          <div className="title">{this.props.artist}</div>
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                width={width}
                height={height}
                rowCount={Math.ceil(this.state.albums.length / 2)}
                rowHeight={195}
                rowRenderer={this.rowRenderer}
                scrollTop={this.state.scrollTop}
                onScroll={this.onScroll}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
}
