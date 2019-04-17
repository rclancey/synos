import React from 'react';

const TrackPadding = ({
  count,
  rowHeight,
  width,
}) => {
  if (count <= 0) {
    return null;
  }
  const style = {
    height: (rowHeight * count)+'px',
    width: width+'px',
  };
  return (
    <div style={style} />
  );
};

export class TrackList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      top: 0,
      count: 1,
      rowHeight: 10,
      tracks: props.tracks,
      selected: null,
    };
    this.node = null;
    this.resize = this.resize.bind(this);
  }

  componentDidMount() {
    this.sortTracks();
    this.resize();
    this.setTop();
    window.addEventListener('resize', this.resize, { passive: true });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize, { passive: true });
  }

  componentDidUpdate(prevProps) {
    if (this.props.tracks !== prevProps.tracks) {
      this.sortTracks();
    }
    if (this.props.columns !== prevProps.columns) {
      const width = this.props.columns.reduce((acc, col) => acc + col.width);
      this.setState({ width });
    }
  }

  sortTracks() {
    this.setState({ tracks: this.props.tracks });
  }

  resize() {
    if (this.node === null) {
      return;
    }
    const row = this.node.children[1];
    if (row === null || row === undefined) {
      return;
    }
    const rowHeight = row.offsetHeight;
    const rowsPerScreen = Math.ceil(node.offsetHeight / rowHeight);
    const pagesPerScreen = Math.ceil(rowsPerScreen / this.props.pageSize);
    const count = (pagesPerScreen + 2) * this.props.pageSize;
    this.setState({ rowHeight, count });
  }

  setTop() {
    if (this.node === null) {
      return;
    }
    const rowsOffScreen = Math.floor(this.node.scrollTop / this.state.rowHeight) - 1;
    const pagesOffScreen = Math.floor(rowsOffScreen / this.props.pageSize);
    const top = pagesOffScreen * this.props.pageSize;
    this.setState({ top });
  }

  render() {
    const n = this.state.tracks.length;
    const topPadding = this.state.top;
    const start = this.state.top;
    const end = this.state.top + this.state.count;
    const botPadding = n - end;
    return (
      <div
        ref={node => { if (node !== null && node !== undefined) { this.node = node } }}
        className="trackList"
        style={{ width: this.state.width+'px' }}
      >
        <TrackListHeader columns={this.props.columns} />
        <div
          ref={node => {
            if (node !== null && node !== undefined) {
              this.node = node;
              this.resize();
            }
          }
          className="trackListBody"
          style={{ width: this.state.width+'px' }}
          onScroll={this.setTop}
        >
          <TrackPadding
            count={topPadding}
            rowHeight={this.state.rowHeight}
            columns={this.props.columns}
          />
          { this.state.tracks.slice(start, end).map(track => (
            <Track key={track.id} columns={this.props.columns} {...track} />
          )) }
          <TrackPadding
            count={botPadding}
            rowHeight={this.sate.rowHeight}
            columns={this.props.columns}
          />
        </div>
      </div>
    );
  }
}

const Track = ({
  selected,
  columns,
  onSelect,
  onPlay,
  ...props,
}) => {
  return (
    <div
      className={"track" + selected ? ' selected' : ''}
      width={width}
      onClick={onSelect}
      onDoubleClick={onPlay}
    >
      { columns.map(col => (
        <div key={col.key} style={{width: col.width+'px'}}>{props[col.key] || '\u00a0'}</div>
      )) }
    </div>
  );
};

