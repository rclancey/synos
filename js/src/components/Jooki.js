import React from 'react';
import { TreeView } from './TreeView';

export const JookiToken = ({
  starId,
  size,
}) => {
  const src = starId.toLowerCase().replace(/\./g, '-');
  return (
    <div className="jookiToken" style={{
      width: `${size}px`,
      height: `${size}px`,
    }}>
      {/*
      padding: `${size * 0.15}px`,
      borderRadius: `${size}px`,
      */}
      <img src={`/${src}.png`} />
    </div>
  );
};

export const JookiPlaylists = ({ jooki, selected, parentNode, onSelect, onAddToPlaylist }) => {
  const pls = Object.entries(jooki.db.playlists).map(entry => Object.assign({}, entry[1], { id: entry[0] }));
  pls.sort((a, b) => a.title < b.title ? -1 : a.title > b.title ? 1 : 0);
  return pls.map(item => {
    /*
    const { connectDropTarget, connectDragSource, isOverShallow, depth = 0, node, ...props } = this.props;
    const { children = [] } = node;
    const open = this.state.hoverOpen || props.openFolders[node.persistent_id];
    const cls = [
      'folder',
      this.selected(),
      isOverShallow ? 'dropTarget' : '',
    ];
    return connectDropTarget(connectDragSource(
    */
    return (
      <div
        key={item.id}
        className="folder"
        onClick={null}
      >
        <div className="label" style={{ paddingLeft: '0px' }}>
          {item.star ? <JookiToken size={16} starId={item.star} /> : <div className="icon standard" />}
          <div className="title">{item.title}</div>
        </div>
      </div>
    );
  });
};

