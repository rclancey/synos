import React from 'react';
//import { displayTime } from '../lib/columns';
import { CoverArt } from './CoverArt';
import { TrackInfo, TrackTime } from './TrackInfo';

export const QueueInfo = ({ tracks }) => {
  const durT = tracks.reduce((sum, val) => sum + val.total_time, 0) / 60000;
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
  const songs = tracks.length > 1 ? 'songs' : 'song';
  return (
    <div className="queueInfo">
      {`${tracks.length} ${songs}\u00a0\u2014\u00a0${dur}`}
    </div>
  );
};

export const QueueItem = ({ track, coverSize, coverRadius, current, selected, onSelect, onPlay }) => (
  <div
    className={"item" + (selected ? ' selected' : '')}
    onClick={onSelect}
    onDoubleClick={onPlay}
  >
    <CoverArt track={track} size={coverSize} radius={coverRadius} >
      { current ? (<div className="current" />) : null }
    </CoverArt>
    <TrackInfo track={track} />
    <TrackTime ms={track.total_time} className="time" />
  </div>
);

export class DesktopQueue extends React.Component {
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
            selected={track.persistent_id === this.state.selected}
            onSelect={() => this.setState({ selected: track.persistent_id })}
          />
        )) }
      </div>
    );
  }
}

export const MobileQueue = ({ tracks, index, onSelect, onClose }) => (
  <div className="queue">
    <div className="header">
      <div className="title">Queue</div>
      <QueueInfo tracks={tracks} />
      <div className="toggles">
        <div className="shuffle fas fa-random" />
        <div className="loop fas fa-recycle" />
        <div className="close fas fa-times" onClick={onClose} />
      </div>
    </div>
    <div className="items">
      { tracks.map((track, i) => (
        <QueueItem
          track={track}
          selected={i === index}
          current={i === index}
          onSelect={() => onSelect(track, i)}
        />
      )) }
    </div>
  </div>
);
