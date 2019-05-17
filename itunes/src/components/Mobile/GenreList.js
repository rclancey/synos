import React from 'react';
import { List, AutoSizer } from "react-virtualized";
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
        const index = this.makeIndex(genres || []);
        const gens = genres ? genres.map(gen => gen[0]) : [];
        this.setState({ genres: gens, index });
      });
  }

  makeIndex(genres) {
    const index = [];
    let prev = null;
    genres.forEach((genre, i) => {
      let first = genre[1].substr(0, 1);
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
    return `url(/api/art/genre?genre=${escape(genre)})`;
  }

  rowRenderer({ key, index, style }) {
    const genre = this.state.genres[index];
    return (
      <div key={key} className="item" style={style} onClick={() => this.onOpen(genre)}>
        <div className="genreImage" style={{backgroundImage: this.genreImageUrl(genre)}} />
        <div className="title">{genre}</div>
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
            <div key={idx.name} onClick={() => this.setState({ scrollTop: idx.scrollTop })}>{idx.name}</div>
          ))}
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                width={width}
                height={height}
                rowCount={this.state.genres.length}
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
