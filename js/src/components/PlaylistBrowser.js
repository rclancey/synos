import React from 'react';
//import SortableTree from 'react-sortable-tree';
//import FolderTheme from 'react-sortable-tree-theme-file-explorer';
import { PLAYLIST_ORDER } from '../lib/distinguished_kinds';
import { TreeView } from './TreeView';

export class PlaylistBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focused: false,
    };
    this.onKeyPress = this.onKeyPress.bind(this);
  }

  findPlaylist(id, folder) {
    let pl = folder.find(p => p.persistent_id === id);
    if (pl !== null && pl !== undefined) {
      return pl;
    }
    for (let c of folder) {
      if (c.children !== null && c.children !== undefined) {
        pl = this.findPlaylist(id, c.children);
        if (pl !== null) {
          return pl;
        }
      }
    }
    return null;
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      document.body.addEventListener('keydown', this.onKeyPress);
    }
  }

  onKeyPress(evt) {
    if (this.state.focused) {
      if (evt.key === 'Delete' || evt.key === 'Backspace') {
        const pl = this.findPlaylist(this.props.selected, this.props.playlists);
        if (pl !== null) {
          const msg = `Are you sure you want to delete the playlist ${pl.name}?`;
          this.props.onConfirm(msg, () => console.debug('deleting playlist %o', pl));
        }
      }
    }
  }

  render() {
    /*
          searchQuery={searchString}
          searchFocusOffset={searchFocusIndex}
          searchFinishCallback={matches =>
            this.setState({
              searchFoundCount: matches.length,
              searchFocusIndex:
                matches.length > 0 ? searchFocusIndex % matches.length : 0,
            })
          }
    */
    console.debug("playlists = %o, order = %o", this.props.playlists, PLAYLIST_ORDER);
    return (
      <div
        ref={node => this.node = node}
        tabIndex={10}
        className="playlistBrowser"
        onFocus={(evt) => { console.debug('focusing: %o', evt.nativeEvent); this.setState({ focused: true }); }}
        onBlur={(evt) => { console.debug('bluring: %o', evt.nativeEvent); this.setState({ focused: false }); }}
      >
        <h1>Library</h1>
        <div className="groups">
          <div
            className={'label' + (this.props.selected === null ? ' selected' : '')}
            onClick={event => this.props.onSelect(null, event)}
          >
            <div className="icon songs" />
            Everything
          </div>
          { this.props.playlists
            .filter(pl => {
              const o = PLAYLIST_ORDER[pl.kind];
              if (o === null || o === undefined || o < 0 || o >= 100) {
                return false;
              }
              return true;
            }).map(pl => (
              <div
                key={pl.persistent_id}
                className={'label' + (this.props.selected === pl.persistent_id ? ' selected' : '')}
                onClick={event => this.props.onSelect(pl, event)}
              >
                <div className={`icon ${pl.kind}`} />
                {pl.name}
              </div>
            )) }
        </div>
        <h1>Music Playlists</h1>
        { this.props.playlists
          .filter(pl => {
            const o = PLAYLIST_ORDER[pl.kind];
            if (o === null || o === undefined || o >= 100) {
              return true;
            }
            return false;
          }).map(item => (
            <TreeView
              key={item.persistent_id}
              root={item}
              node={item}
              selected={this.props.selected}
              indentPixels={12}
              openFolders={this.props.openFolders}
              onToggle={this.props.onToggle}
              onSelect={node => { this.node.focus(); this.props.onSelect(node); }}
              onMovePlaylist={this.props.onMovePlaylist}
              onAddToPlaylist={this.props.onAddToPlaylist}
            />
          )) }
        {/*
        <SortableTree
          treeData={this.props.playlists}
          theme={FolderTheme}
          onChange={treeData => this.props.onChange(treeData)}


          canDrag={({ node }) => !node.dragDisabled}
          canDrop={({ nextParent }) => !nextParent || nextParent.folder}
          generateNodeProps={rowInfo => ({
            onClick: (event) => this.props.onSelect(rowInfo, event),
            className: rowInfo.node.persistent_id === this.props.selected ? 'selected' : '',
            icons: [
              <div className={`icon ${rowInfo.node.kind}`} />
            ],
          })}
        />
        */}



      </div>
    );
  }
}
