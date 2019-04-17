import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';

const getPath = (root, item) => {
  if (root.persistent_id === item.persistent_id) {
    return [root.persistent_id];
  }
  if (root.children) {
    for (let child of root.children) {
      let found = getPath(child, item);
      if (found !== null) {
        return [root.persistent_id].concat(found);
      }
    }
  }
  return null;
};

const playlistTarget = {
  drop(props, monitor, component) {
    if (props.node.kind === 'folder') {
      if (monitor.getItemType() === 'Track') {
        return undefined;
      }
      const item = monitor.getItem().playlist;
      if (monitor.getItemType() === 'Playlist') {
        if (item.kind === 'folder') {
          const path = getPath(props.root, props.node);
          if (path === null) {
            return undefined;
          }
          if (path.includes(item.persistent_id)) {
            return undefined;
          }
        }
      }
      return props.onMovePlaylist(item, props.node);
    } else if (monitor.getItemType() !== 'Track') {
      return undefined;
    }
    return props.onAddToPlaylist(props.node, monitor.getItem().tracks.map(x => x.rowData));
  },
  canDrop(props, monitor, component) {
    if (!monitor.isOver({ shallow: true })) {
      return false;
    }
    return true;
  },
};

const playlistSource = {
  beginDrag(props, monitor, component) {
    console.debug('playlist beginDrag(%o, %o, %o)', props, monitor, component);
    return { playlist: props.node };
  },
};

function dropCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverShallow: monitor.isOver({ shallow: true }),
  };
}

function dragCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
}

class PlainTreeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hoverOpen: false,
    };
    this.toggle = this.toggle.bind(this);
    this.select = this.select.bind(this);
  }

  toggle() {
    console.debug('toggle %o', this.props);
    this.props.onToggle(this.props.node);
  }

  select() {
    console.debug('select %o', this.props);
    this.props.onSelect(this.props.node);
  }

  selected() {
    return this.props.selected === this.props.node.persistent_id ? 'selected' : '';
  }

  indent() {
    const { indentPixels = 1, depth = 0 } = this.props;
    return { paddingLeft: (indentPixels * depth)+'px' };
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOver !== prevProps.isOver) {
      if (this.hoverOpenTimeout !== null) {
        clearTimeout(this.hoverOpenTimeout);
        this.hoverOpenTimeout = null;
      }
      if (!this.props.isOver) {
        this.setState({ hoverOpen: false });
      } else {
        this.hoverOpenTimeout = setTimeout(() => {
          if (this.props.isOver) {
            this.setState({ hoverOpen: true });
          }
        }, 1000);
      }
    }
  }

  renderLabel() {
    const { connectDropTarget, connectDragSource, isOver, isOverShallow, node } = this.props;
    const open = this.state.hoverOpen || this.props.openFolders[node.persistent_id];
    const cls = this.props.node.kind === 'folder' ? [
      'folderToggle',
      open ? 'open' : '',
    ] : [];
    return (//connectDropTarget(connectDragSource(
      <div className="label" style={this.indent()}>
        { this.props.node.kind === 'folder' ? (
          <div className={cls.join(' ')} onClick={this.toggle} />
        ) : null }
        <div className={`icon ${node.kind}`} />
        <div className="title">{node.title}</div>
      </div>
    );
  }

  render() {
    const { connectDropTarget, connectDragSource, isOverShallow, depth = 0, node, ...props } = this.props;
    const { children = [] } = node;
    const open = this.state.hoverOpen || props.openFolders[node.persistent_id];
    const cls = [
      'folder',
      this.selected(),
      isOverShallow ? 'dropTarget' : '',
    ];
    return connectDropTarget(connectDragSource(
      <div
        className={cls.join(' ')}
        onClick={this.select}
      >
        { this.renderLabel() }
        { node.kind === 'folder' && open ? (
          <div className="folderContents">
            { children.map(child => (
              <TreeView
                key={child.persistent_id}
                node={child}
                depth={depth + 1}
                {...props}
              />
            )) }
          </div>
        ) : null }
      </div>
    ));
  }
}

export const TreeView = DragSource('Playlist', playlistSource, dragCollect)(DropTarget(['Playlist', 'Track'], playlistTarget, dropCollect)(PlainTreeView));
