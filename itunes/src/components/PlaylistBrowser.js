import React from 'react';
import SortableTree from 'react-sortable-tree';
import FolderTheme from 'react-sortable-tree-theme-file-explorer';
import { TreeView } from './TreeView';

export class PlaylistBrowser extends React.Component {
  constructor(props) {
    super(props);
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
    return (
      <div className="playlistBrowser">
        <h1>Library</h1>
        <div className="groups">
          <div
            className={'label' + (this.props.selected === null ? ' selected' : '')}
            onClick={event => this.props.onSelect(null, event)}
          >
            <div className="icon songs" />
            Everything
          </div>
          { this.props.playlists.filter(pl => !!pl.distinguished_kind).map(pl => (
            <div
              key={pl.persistent_id}
              className={'label' + (this.props.selected == pl.persistent_id ? ' selected' : '')}
              onClick={event => this.props.onSelect(pl, event)}
            >
              <div className={`icon ${pl.kind}`} />
              {pl.name}
            </div>
          )) }
        </div>
        <h1>Music Playlists</h1>
        { this.props.playlists.filter(pl => !pl.distinguished_kind).map(item => (
          <TreeView
            key={item.persistent_id}
            root={item}
            node={item}
            selected={this.props.selected}
            indentPixels={12}
            openFolders={this.props.openFolders}
            onToggle={this.props.onToggle}
            onSelect={this.props.onSelect}
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
