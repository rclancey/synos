import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
//import { List, AutoSizer } from "react-virtualized";
import { ArtistList } from './ArtistList';

export class GenreList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollTop: 0,
      genres: [],
      genre: null,
      index: [],
    };
    this.onClose = this.onClose.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  componentDidMount() {
    this.loadGenres();
  }

  componentDidUpdate(prevProps) {
    if (this.props.genre !== prevProps.genre) {
      this.loadArtists();
    }
  }

  loadGenres() {
    const url = '/api/index/genres';
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(genres => {
        genres.forEach(genre => {
          genre.name = Object.keys(genre.names).sort((a, b) => genre.names[a] < genre.names[b] ? 1 : genre.names[a] > genre.names[b] ? -1 : 0)[0];
        });
        const index = this.makeIndex(genres || []);
        this.setState({ genres, index });
      });
  }

  makeIndex(genres) {
    const index = [];
    let prev = null;
    genres.forEach((genre, i) => {
      let first = genre.sort.substr(0, 1);
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

  onOpen(genre) {
    this.setState({ genre });
  }

  onClose() {
    if (this.state.genre === null) {
      this.props.onClose();
    } else {
      this.setState({ genre: null });
    }
  }

  onScroll({ scrollTop }) {
    this.setState({ scrollTop });
  }

  genreImageUrl(genre) {
    return `url(/api/art/genre?genre=${escape(genre.sort)})`;
  }

  rowRenderer({ key, index, style }) {
    const genre = this.state.genres[index];
    return (
      <div key={key} className="item" style={style} onClick={() => this.onOpen(genre)}>
        <div className="genreImage" style={{backgroundImage: this.genreImageUrl(genre)}} />
        <div className="title">{genre.name}</div>
      </div>
    );
  }

  render() {
    if (this.state.genre !== null) {
      return (
        <ArtistList
          prev="Genres"
          genre={this.state.genre}
          onClose={this.onClose}
        />
      );
    }
    return (
      <div className="genreList">
        <div className="back" onClick={this.onClose}>{this.props.prev}</div>
        <div className="header">
          {/*<div className="icon genres" />*/}
          <div className="title">Genres</div>
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
                itemCount={this.state.genres.length}
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
