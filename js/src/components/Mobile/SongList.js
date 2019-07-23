import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { DotsMenu } from './TrackMenu';

export class Playlist extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tracks: [],
    };
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  componentDidMount() {
    fetch(`/api/playlist/${this.props.playlist.persistent_id}/tracks`, { method: 'GET' })
      .then(resp => resp.json())
      .then(tracks => this.setState({ tracks }));
  }

  renderIcon() {
    const img = this.state.tracks.slice(0, 4).map(track => {
      return `url(/api/art/track/${track.persistent_id})`;
    });
    return (
      <div className="cover">
        <div className="row">
          <div className="col" style={{ backgroundImage: img[0] }} />
          <div className="col" style={{ backgroundImage: img[1] }} />
        </div>
        <div className="row">
          <div className="col" style={{ backgroundImage: img[2] }} />
          <div className="col" style={{ backgroundImage: img[3] }} />
        </div>
      </div>
    );
  }

  renderTitle() {
    const durT = this.state.tracks.reduce((sum, val) => sum + val.total_time, 0) / 60000;
    let dur = '';
    if (durT < 59.5) {
      dur = `${Math.round(durT)} minutes`;
    } else if (durT < 60 * 24) {
      const hours = Math.floor(durT / 60);
      const mins = Math.round(durT) % 60;
      dur = `${hours} ${hours > 1 ? 'hours' : 'hour'}, ${mins} ${mins > 1 ? 'minutes' : 'minute'}`;
    } else {
      const days = Math.floor(durT / (60 * 24));
      const hours = Math.round(durT / 60);
      dur = `${days} ${days > 1 ? 'days': 'day'}, ${hours} ${hours > 1 ? 'hours' : 'hour'}`;
    }
    return (
      <div className="title">
        <div className="album">{this.props.playlist.name}</div>
        <div className="genre">
          {`${this.state.tracks.length} Tracks`}
          {`\u00a0\u2219\u00a0${dur}`}
        </div>
        <DotsMenu track={this.state.tracks} onOpen={tracks => this.props.onPlaylistMenu(this.props.playlist.name, tracks)} />
      </div>
    );
  }

  rowRenderer({ index, style }) {
    const track = this.state.tracks[index];
    return (
      <div className="item" style={style}>
        <div className="cover" style={{ backgroundImage: `url(/api/art/track/${track.persistent_id})` }} />
        <div className="title">
          <div className="song">{track.name}</div>
          <div className="artist">{track.artist}</div>
        </div>
        <DotsMenu track={track} onOpen={this.props.onTrackMenu} />
      </div>
    );
  }

  render() {
    return (
      <div className="songList">
        <div className="back" onClick={this.props.onClose}>{this.props.prev}</div>
        <div className="header">
          {this.renderIcon()}
          {this.renderTitle()}
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                width={width}
                height={height}
                itemCount={this.state.tracks.length}
                itemSize={63}
                overscanCount={Math.ceil(height / 58)}
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

export class Album extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tracks: [],
    };
    this.rowRenderer = this.rowRenderer.bind(this);
  }

  componentDidMount() {
    fetch(`/api/index/songs?artist=${escape(this.props.album.artist.sort)}&album=${escape(this.props.album.sort)}`, { method: 'GET' })
      .then(resp => resp.json())
      .then(tracks => this.setState({ tracks }));
  }

  renderIcon() {
    if (this.state.tracks.length === 0) {
      return null;
    }
    const url = `/api/art/track/${this.state.tracks[0].persistent_id}.jpg`;
    return (
      <div className="cover" style={{backgroundImage: `url(${url})`}} />
    );
  }

  renderTitle() {
    if (this.state.tracks.length === 0) {
      return null;
    }
    const first = this.state.tracks[0];
    return (
      <div className="title">
        <div className="album">{first.album}</div>
        <div className="artist">{first.album_artist || first.artist}</div>
        <div className="genre">
          {first.genre}
          {first.year ? `\u00a0\u2219\u00a0${first.year}` : ''}
        </div>
        <DotsMenu track={this.state.tracks} onOpen={tracks => this.props.onPlaylistMenu(first.album, tracks)} />
      </div>
    );
  }

  rowRenderer({ index, style }) {
    const track = this.state.tracks[index];
    return (
      <div className="item" style={style}>
        <div className="tracknum">{track.track_number}</div>
        <div className="title">
          <div className="song">{track.name}</div>
          { (track.compilation || (track.album_artist && track.album_artist !== track.artist)) ? (
            <div className="artist">{track.artist}</div>
          ) : null }
        </div>
        <DotsMenu track={track} onOpen={this.props.onTrackMenu} />
      </div>
    );
  }

  render() {
    return (
      <div className="songList">
        <div className="back" onClick={this.props.onClose}>{this.props.prev.name}</div>
        <div className="header">
          {this.renderIcon()}
          {this.renderTitle()}
        </div>
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                width={width}
                height={height}
                itemCount={this.state.tracks.length}
                itemSize={63}
                overscanCount={Math.ceil(height / 63)}
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

