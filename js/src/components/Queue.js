import React, { useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";
import { ShuffleButton, RepeatButton, CloseButton } from './Controls';
import { CoverArt } from './CoverArt';
import { TrackInfo, TrackTime } from './TrackInfo';

export const QueueHeader = ({ playMode, tracks, onShuffle, onRepeat, onClose }) => {
  const toggleStyle = { flex: 1, marginRight: '0.5em' };
  return (
    <div className="header">
      <div className="title">Queue</div>
      <QueueInfo
        tracks={tracks}
        style={{
          flex: 10,
          fontSize: '10pt',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      />
      <div className="toggles">
        { onShuffle ? (
          <ShuffleButton playMode={playMode} onShuffle={onShuffle} style={toggleStyle} />
        ) : null }
        { onRepeat ? (
          <RepeatButton playMode={playMode} onRepeat={onRepeat} style={toggleStyle} />
        ) : null }
        { onClose ? (
          <CloseButton onClose={onClose} style={toggleStyle} />
        ) : null }
      </div>
    </div>
  );
};

const plur = (n, s) => (n === 1 ? s : `${s}s`);

export const QueueInfo = ({ tracks, ...props }) => {
  const dur = useMemo(() => {
    const durT = tracks.reduce((sum, val) => sum + val.total_time, 0) / 60000;
    let s = '';
    if (durT < 59.5) {
      const mins = Math.round(durT);
      return `${mins} ${plur(mins, 'minute')}`;
    }
    if (durT < 60 * 24) {
      const hours = Math.floor(durT / 60);
      const mins = Math.round(durT) % 60;
      return `${hours} ${plur(hours, 'hour')}, ${mins} ${plur(mins, 'minute')}`;
    }
    const days = Math.floor(durT / (60 * 24));
    const hours = Math.round(durT / 60);
    return `${days} ${plur(days, 'day')}, ${hours} ${plur(hours, 'hour')}`;
  }, [tracks]);
  const n = tracks.length;
  return (
    <div className="queueInfo" {...props}>
      {`${n} ${plur(n, 'song')}\u00a0\u2014\u00a0${dur}`}
    </div>
  );
};

export const QueueItem = ({
  track,
  coverSize,
  coverRadius,
  current,
  selected,
  infoClassName,
  onSelect,
  onPlay
}) => {
  return (
    <div
      className={"item" + (selected ? ' selected' : '')}
      onClick={onPlay}
      onDoubleClick={onPlay}
    >
      <CoverArt track={track} size={coverSize} radius={coverRadius} >
        { current ? (<div className="current" />) : null }
      </CoverArt>
      <TrackInfo track={track} className="queue" />
      <TrackTime ms={track.total_time} className="time" />
    </div>
  );
};

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
          coverSize={36}
          selected={i === index}
          current={i === index}
          onSelect={() => onSelect(track, i)}
        />
      )) }
    </div>
  </div>
);
