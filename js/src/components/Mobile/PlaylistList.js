import React from 'react';
import _ from 'lodash';
import { List, AutoSizer } from "react-virtualized";
import { DISTINGUISHED_KINDS, PLAYLIST_ORDER } from '../../lib/distinguished_kinds';
import { Playlist } from './SongList';

export class PlaylistList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollTop: [0],
      path: [],
      playlists: [],
    };
    this.onClose = this.onClose.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
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
    this.setState({
      scrollTop: this.state.scrollTop.concat([0]),
      path: this.state.path.concat([pl]),
    });
  }

  onClose() {
    if (this.state.path.length === 0) {
      this.props.onClose();
    } else {
      //const t = this.state.scrollTop[this.state.scrollTop.length - 1];
      this.setState({
        scrollTop: this.state.scrollTop.slice(0, this.state.scrollTop.length - 1),
        path: this.state.path.slice(0, this.state.path.length - 1),
      });//, () => document.body.parentNode.scrollTo(0, t));
    }
  }

  onScroll({ scrollTop }) {
    const tops = this.state.scrollTop.slice(0);
    tops.pop();
    tops.push(scrollTop);
    this.setState({ scrollTop: tops });
  }

  folder() {
    if (this.state.path.length === 0) {
      return this.state.playlists;
    }
    return this.state.path[this.state.path.length - 1].children || [];
  }

  rowRenderer({ key, index, style }) {
    const pl = this.folder()[index];
    return (
      <div key={pl.persistent_id} className="item" style={style} onClick={() => this.onOpen(pl)}>
        <div className={`icon ${pl.kind}`} />
        <div className="title">{pl.name}</div>
      </div>
    );
  }

  render() {
    let title = 'Playlists';
    let prevTitle = this.props.prev;
    if (this.state.path.length > 0) {
      prevTitle = 'Playlists';
      if (this.state.path.length > 1) {
        prevTitle = this.state.path[this.state.path.length-2].name;
      }
      const pl = this.state.path[this.state.path.length-1];
      if (pl.folder) {
        title = pl.name;
      } else {
        return (
          <Playlist
            playlist={pl}
            prev={prevTitle}
            onClose={this.onClose}
            onEnqueue={this.props.onEnqueue}
            onTrackMenu={this.props.onTrackMenu}
            onPlaylistMenu={this.props.onPlaylistMenu}
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
        <div className="items">
          <AutoSizer>
            {({width, height}) => (
              <List
                width={width}
                height={height}
                rowCount={this.folder().length}
                rowHeight={58}
                rowRenderer={this.rowRenderer}
                scrollTop={this.state.scrollTop[this.state.scrollTop.length - 1]}
                onScroll={this.onScroll}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }

}
