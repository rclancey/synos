import React from 'react';
import { List, AutoSizer } from "react-virtualized";
import { AlbumList } from './AlbumList';

export class ArtistList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollTop: 0,
      artists: [],
      artist: null,
      index: [],
    };
    this.onClose = this.onClose.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  componentDidMount() {
    this.loadArtists();
  }

  componentDidUpdate(prevProps) {
    if (this.props.genre !== prevProps.genre) {
      this.loadArtists();
    }
  }

  loadArtists() {
    let url = '/api/index/artists';
    if (this.props.genre) {
      url += `?genre=${this.props.genre}`
    }
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(artists => {
        const index = this.makeIndex(artists || []);
        const arts = artists ? artists.map(art => art[0]) : [];
        this.setState({ artists: arts, index });
      });
  }

  makeIndex(artists) {
    const index = [];
    let prev = null;
    artists.forEach((artist, i) => {
      let first = artist[1].substr(0, 1);
      if (!first.match(/^[a-z]/)) {
        first = '#';
      }
      if (prev !== first) {
        index.push({ name: first.toUpperCase(), scrollTop: i * 58 });
        prev = first;
      }
    });
    return index;
  }

  onOpen(artist) {
    this.setState({ artist });
  }

  onClose() {
    if (this.state.artist === null) {
      this.props.onClose();
    } else {
      this.setState({ artist: null });
    }
  }

  onScroll({ scrollTop }) {
    this.setState({ scrollTop });
  }

  artistImageUrl(artist) {
    const url = `url(/api/art/artist?artist=${escape(artist)})`;
    console.debug('artist image url = %o', url);
    return url;
  }

  rowRenderer({ key, index, style }) {
    const artist = this.state.artists[index];
    return (
      <div key={key} className="item" style={style} onClick={() => this.onOpen(artist)}>
        <div className="artistImage" style={{backgroundImage: this.artistImageUrl(artist)}} />
        <div className="title">{artist}</div>
      </div>
    );
  }

  render() {
    if (this.state.artist !== null) {
      return (
        <AlbumList
          prev={this.props.genre || "Artists"}
          artist={this.state.artist}
          onClose={this.onClose}
          onTrackMenu={this.props.onTrackMenu}
        />
      );
    }
    return (
      <div className="artistList">
        <div className="back" onClick={this.onClose}>{this.props.prev}</div>
        <div className="header">
          <div className="title">{this.props.genre || 'Artists'}</div>
        </div>
        <div className="index">
          {this.state.index.map(idx => (
            <div key={idx.name} onClick={() => this.setState({ scrollTop: idx.scrollTop })}>{idx.name}</div>
          ))}
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                width={width}
                height={height}
                rowCount={this.state.artists.length}
                rowHeight={58}
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
