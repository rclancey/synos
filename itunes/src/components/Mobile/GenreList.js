import React from 'react';
import { ArtistList } from './ArtistList';

export class GenreList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      genres: [],
      genre: null,
    };
    this.onClose = this.onClose.bind(this);
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
      .then(genres => this.setState({ genres }));
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

  genreImageUrl(genre) {
    return `/api/genreArt?genre=${genre}`;
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
        <div className="header">
          <div className="back" onClick={this.onClose}>{this.props.prev}</div>
          <div className="icon genres" />
          <div className="title">Genres</div>
        </div>
        {this.state.genres.map(genre => (
          <div className="item" onClick={() => this.onOpen(genre)}>
            <div className="genreImage" style={{backgroundImage: this.genreImageUrl(genre)}} />
            <div className="title">{genre}</div>
          </div>
        ))}
      </div>
    );
  }
}
