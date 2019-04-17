import React from 'react';
import { displayTime } from '../lib/columns';

const QueueItem = ({ track, selected, onSelect }) => {
  const cover = `/api/cover/${track.persistent_id}`;
  return (
    <div
      className={"item" + (selected ? ' selected' : '')}
      onClick={onSelect}
    >
      <div className="cover" style={{ backgroundImage: `url(${cover})` }} />
      <div className="info">
        <div className="title">{track.name}</div>
        <div className="artist">
          {track.artist}{' \u2014 '}{track.album}
        </div>
      </div>
      <div className="time">{displayTime(track.total_time)}</div>
    </div>
  );
};

export class Queue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: null,
    };
  }

  render() {
    return (
      <div className="queue" style={{ left: this.props.x+'px', top: this.props.y+'px' }}>
        { this.props.tracks.slice(this.props.index+1).map(track => (
          <QueueItem
            track={track}
            selected={track.persistent_id == this.state.selected}
            onSelect={() => this.setState({ selected: track.persistent_id })}
          />
        )) }
      </div>
    );
  }
}
