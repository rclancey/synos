import React from "react";
import { Column, Table, defaultTableRowRenderer } from "react-virtualized";
import Draggable from "react-draggable";
import { DragSource, DropTarget } from 'react-dnd';

const rowSource = {
  beginDrag(props, monitor, component) {
    console.debug('beginDrag(%o, %o, %o)', props, monitor, component);
    const tracks = props.list.map((rowData, index) => {
      if (props.selected && props.selected[rowData.persistent_id]) {
        return { index, rowData };
      }
      return null;
    }).filter(rec => rec !== null);
    return { tracks };
  },
};

const rowTarget = {
  drop(props, monitor, component) {
    console.debug('drop track %o at %o', monitor.getItem(), props);
    props.onReorderTracks(props.playlist, props.index, monitor.getItem().tracks.map(t => t.index));
  },
}

function dragCollect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  };
}

function dropCollect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
  };
}

const PlainRow = (props) => {
  //console.debug('<PlainRow %o>', props);
  return defaultTableRowRenderer(props);
};

const Row = ({ connectDragSource, connectDropTarget, isOver, isDragging, ...props }) => {
  const { index, rowData } = props;
  const aria = {
    'aria-label': 'row',
    'aria-rowindex': index,
  }
  return connectDropTarget(connectDragSource(
    <div
      className={`${props.className} ${isOver ? 'dropTarget' : ''}`}
      role="row"
      onClick={event => props.onRowClick({ event, index, rowData })}
      onDoubleClick={event => props.onRowDoubleClick({ event, index, rowData })}
      style={props.style}
      {...aria}
    >
      {props.columns}
    </div>
  ));
};

const DraggableRow = DragSource('Track', rowSource, dragCollect)(DropTarget('Track', rowTarget, dropCollect)(Row));

export class TrackList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focused: false,
    };
    this.rowClassName = this.rowClassName.bind(this);
    this.rowRenderer = this.rowRenderer.bind(this);
    this.renderHeader = this.renderHeader.bind(this);
    this.onKeyPress = this.onKeyPress.bind(this);
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      document.body.addEventListener('keydown', this.onKeyPress);
    }
  }

  componentWillUnmount() {
    if (typeof window !== 'undefined') {
      document.body.removeEventListener('keydown', this.onKeyPress);
    }
  }

  renderHeader({
    columnData,
    dataKey,
    disableSort,
    label,
    sortBy,
    sortDirection
  }) {
    return (
      <React.Fragment key={dataKey}>
        <div
          className="ReactVirtualized__Table__headerTruncatedText"
          onClick={() => this.props.onSort(dataKey)}
        >
          {label}
        </div>
        <Draggable
          axis="x"
          defaultClassName="DragHandle"
          defaultClassNameDragging="DragHandleActive"
          onDrag={(event, { deltaX }) =>
            this.resizeCol({
              dataKey,
              deltaX
            })
          }
          position={{ x: 0 }}
          zIndex={999}
        >
          <span className="DragHandleIcon">⋮</span>
        </Draggable>
      </React.Fragment>
    );
  }

  resizeCol({ dataKey, deltaX }) {
    const oldCols = this.props.columns;
    const pctDelta = deltaX / this.props.totalWidth;
    let smaller = -1;
    const newCols = oldCols.map((col, i) => {
      if (col.key === dataKey) {
        smaller = i+1;
        return Object.assign({}, col, { width: col.width + deltaX });
      } else if (i === smaller) {
        smaller = -1;
        return Object.assign({}, col, { width: col.width - deltaX });
      } else {
        return col;
      }
    });
    this.props.onColumnResize(newCols);
  }

  rowRenderer(props) {
    //console.debug('rowRenderer(%o)', props);
    return (
      <DraggableRow
        playlist={this.props.playlist}
        onReorderTracks={this.props.onReorderTracks}
        list={this.props.list}
        selected={this.props.selected}
        {...props}
      />
    );
  }

  rowClassName({ index }) {
    if (index < 0) {
      return 'header';
    }
    if (this.props.selected && this.props.selected[this.props.list[index].persistent_id]) {
      return 'selected';
    }
    return index % 2 == 0 ? 'even' : 'odd';
  }

  onKeyPress(event) {
    if (this.state.focused) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        this.props.onTrackPlay();
      } else if (event.key == 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        this.props.onTrackDown(event.shiftKey);
      } else if (event.key == 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        this.props.onTrackUp(event.shiftKey);
      }
    }
  }

  render() {
    const { list, columns } = this.props;

    return (
      <div
        ref={node => this.node = node}
        style={{ height: '100%' }}
        onFocus={() => this.setState({ focused: true })}
        onBlur={() => this.setState({ focused: false })}
      >
        <Table
          width={this.props.totalWidth}
          height={this.props.totalHeight}
          headerHeight={20}
          rowHeight={18}
          rowCount={list.length}
          rowGetter={({ index }) => list[index]}
          rowClassName={this.rowClassName}
          onRowClick={this.props.onTrackSelect}
          onRowDoubleClick={({ ...args }) => this.props.onTrackPlay({ ...args, list })}
          rowRenderer={this.rowRenderer}
        >
          { columns.map(col => (
              <Column
                key={col.key}
                headerRenderer={this.renderHeader}
                dataKey={col.key}
                label={col.label}
                width={col.width}
                className={col.className}
                cellDataGetter={col.formatter ? props => col.formatter(props) : undefined}
              />
          )) }
        </Table>
      </div>
    );
  }
}

