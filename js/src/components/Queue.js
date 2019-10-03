import React from 'react';
import { useTheme } from '../lib/theme';
import { ShuffleButton, RepeatButton, CloseButton } from './Controls';
import { CoverArt } from './CoverArt';
import { TrackInfo, TrackTime } from './TrackInfo';

export const QueueHeader = ({ playMode, tracks, onShuffle, onRepeat, onClose }) => {
  const colors = useTheme();
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
      <style jsx>{`
        .header {
          display: flex;
          flex-direction: row;
          width: 100%;
          padding: 0.5em;
          color: ${colors.highlightText};
        }
        .header .title {
          flex: 1;
          font-size: 10pt;
          font-weight: bold;
          white-space: nowrap;
          margin-top: 0;
        }
        .header .toggles {
          flex: 1;
          display: flex;
          flex-direction: row;
          white-space: nowrap;
          margin-right: 0.5em;
        }
      `}</style>
    </div>
  );
};

export const QueueInfo = ({ tracks, ...props }) => {
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
    <div className="queueInfo" {...props}>
      {`${tracks.length} ${songs}\u00a0\u2014\u00a0${dur}`}
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
  const colors = useTheme();
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
      <style jsx>{`
        .item {
          display: flex;
          flex-direction: row;
          box-sizing: border-box;
          width: 100%;
          height: 48px;
          border: solid transparent 1px;
          border-radius: 4px;
          padding-left: 1em;
          padding-right: 1em;
          padding-top: 1px;
          padding-bottom: 1px;
          margin-bottom: 1px;
          cursor: pointer;
        }
        .item.selected {
          background-color: ${colors.highlightText};
          color: ${colors.background};
        }
        .item :global(.coverart) {
          flex: 1;
          box-sizing: border-box;
          border: solid transparent 1px;
          border-radius: 3px;
          margin-right: 1em;
        }
      `}</style>
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
