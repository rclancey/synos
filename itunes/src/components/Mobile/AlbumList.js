import React from 'react';
import { Album } from './SongList';

export class AlbumList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      albums: [],
      album: null,
    };
    this.onClose = this.onClose.bind(this);
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
    let url = '/api/index/albums';
    if (this.props.artist) {
      url += `?artist=${this.props.artist}`;
    }
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(albums => this.setState({ albums: albums ? albums.map(alb => alb[0]) : [] }));
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
    return `url(/api/art/album?artist=${escape(this.props.artist)}&album=${escape(album)})`;
  }

  render() {
    if (this.state.album !== null) {
      return (
        <Album
          prev={this.props.artist || "Albums"}
          artist={this.props.artist}
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
          <div className="title">{this.props.artist}</div>
        </div>
        {this.state.albums.map((album, i) => {
          if (i % 2 == 1) {
            return null;
          }
          const album2 = this.state.albums[i+1];
          return (
            <div className="row">
              <div className="padding" />
              <div className="item" onClick={() => this.onOpen(album)}>
                <div className="coverArt" style={{backgroundImage: this.coverArtUrl(album)}} />
                <div className="title">{album}</div>
              </div>
              <div className="padding" />
              { album2 ? (
                <div className="item" onClick={() => this.onOpen(album2)}>
                  <div className="coverArt" style={{backgroundImage: this.coverArtUrl(album2)}} />
                  <div className="title">{album2}</div>
                </div>
              ) : (
                <div className="item" />
              ) }
              <div className="padding" />
            </div>
          )
        })}
      </div>
    );
  }
}
