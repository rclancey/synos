import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
//import { List, AutoSizer } from "react-virtualized";
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
      url += `?genre=${escape(this.props.genre.sort)}`
    }
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(artists => {
        artists.forEach(art => {
          art.name = Object.keys(art.names).sort((a, b) => art.names[a] < art.names[b] ? 1 : art.names[a] > art.names[b] ? -1 : 0)[0];
        });
        const index = this.makeIndex(artists || []);
        this.setState({ artists, index });
      });
  }

  makeIndex(artists) {
    const index = [];
    let prev = null;
    artists.forEach((artist, i) => {
      let first = artist.sort.substr(0, 1);
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
    const url = `url(/api/art/artist?artist=${escape(artist.sort)})`;
    console.debug('artist image url = %o', url);
    return url;
  }

  rowRenderer({ key, index, style }) {
    console.debug('ArtistList.rowRenderer({ %o, %o, %o })', key, index, style);
    const artist = this.state.artists[index];
    return (
      <div key={key} className="item" style={style} onClick={() => this.onOpen(artist)}>
        <div className="artistImage" style={{backgroundImage: this.artistImageUrl(artist)}} />
        <div className="title">{artist.name}</div>
      </div>
    );
  }

  render() {
    if (this.state.artist !== null) {
      return (
        <AlbumList
          prev={this.props.genre ? this.props.genre.name : "Artists"}
          artist={this.state.artist}
          onClose={this.onClose}
          onTrackMenu={this.props.onTrackMenu}
          onPlaylistMenu={this.props.onPlaylistMenu}
        />
      );
    }
    return (
      <div className="artistList">
        <div className="back" onClick={this.onClose}>{this.props.prev}</div>
        <div className="header">
          <div className="title">{this.props.genre ? this.props.genre.name : 'Artists'}</div>
        </div>
        <div className="index">
          {this.state.index.map(idx => (
            <div key={idx.name} onClick={() => this.ref.scrollTo(idx.scrollTop)}>{idx.name}</div>
          ))}
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                ref={ref => this.ref = ref}
                width={width}
                height={height}
                itemCount={this.state.artists.length}
                itemSize={58}
                overscanCount={Math.ceil(height / 58)}
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
