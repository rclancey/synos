import React from 'react';
import _ from 'lodash';
import { DISTINGUISHED_KINDS, PLAYLIST_ORDER } from '../lib/distinguished_kinds';
import { Playlist } from './SongList';

export class PlaylistList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      top: [0],
      path: [],
      playlists: [],
    };
    this.onClose = this.onClose.bind(this);
  }

  componentDidMount() {
    this.loadPlaylists();
  }

  loadPlaylists() {
    const restructure = playlist => {
      const pl = Object.assign({}, playlist);
      pl.title = pl.name;
      delete(pl.children);
      if (pl.distinguished_kind) {
        pl.kind = DISTINGUISHED_KINDS[pl.distinguished_kind]
      } else if (pl.folder) {
        pl.kind = 'folder';
        pl.children = playlist.children ? _.sortBy(playlist.children.map(restructure), [(x => !x.folder), (x => x.title.toLowerCase())]) : [];
      } else if (pl.genius_track_id) {
        pl.kind = 'genius';
      } else if (pl.smart) {
        pl.kind = 'smart';
      } else {
        pl.kind = 'playlist';
      }
      return pl;
    };
    //const url = '/jsonlib/playlists.json';
    const url = '/api/playlists';
    return fetch(url, { method: 'GET' })
      .then(resp => resp.json())
      .then(data => {
        const playlists = _.sortBy(data.map(restructure).filter(x => PLAYLIST_ORDER[x.kind] !== -1), [(x => PLAYLIST_ORDER[x.kind] || 999), (x => x.title.toLowerCase())]);
        this.setState({ playlists });
      });
  }

  onOpen(pl) {
    const t = document.body.parentNode.scrollTop;
    document.body.parentNode.scrollTo(0, 0);
    this.setState({
      top: this.state.top.concat([t]),
      path: this.state.path.concat([pl]),
    });
  }

  onClose() {
    if (this.state.path.length == 0) {
      this.props.onClose();
    } else {
      const t = this.state.top[this.state.top.length - 1];
      this.setState({
        top: this.state.top.slice(0, this.state.top.length - 1),
        path: this.state.path.slice(0, this.state.path.length - 1),
      }, () => document.body.parentNode.scrollTo(0, t));
    }
  }

  render() {
    let pls = this.state.playlists;
    let title = 'Playlists';
    let prevTitle = this.props.prev;
    if (this.state.path.length > 0) {
      prevTitle = 'Playlists';
      if (this.state.path.length > 1) {
        prevTitle = this.state.path[this.state.path.length-2].name;
      }
      const pl = this.state.path[this.state.path.length-1];
      if (pl.folder) {
        pls = pl.children || [];
        title = pl.name;
      } else {
        return (
          <Playlist
            playlist={pl}
            prev={prevTitle}
            onClose={this.onClose}
            onEnqueue={this.props.onEnqueue}
            onTrackMenu={this.props.onTrackMenu}
          />
        );
      }
    }
    return (
      <div className="playlistList">
        <div className="back" onClick={this.onClose}>{prevTitle}</div>
        <div className="header">
          {/*<div className="icon folder" />*/}
          <div className="title">{title}</div>
        </div>
        { pls.map(pl => (
          <div key={pl.persistent_id} className="item" onClick={() => this.onOpen(pl)}>
            <div className={`icon ${pl.kind}`} />
            <div className="title">{pl.name}</div>
          </div>
        )) }
      </div>
    );
  }

}
