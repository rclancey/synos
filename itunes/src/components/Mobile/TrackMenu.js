import React from 'react';
import { QueueInfo } from '../Queue';

export const PlaylistMenu = ({
  name,
  tracks,
  onClose,
  onPlay,
  onSkipBy,
  onReplaceQueue,
  onInsertIntoQueue,
  onAppendToQueue,
}) => (
  <div className="disabler">
    <div className="playlistMenu">
      <div className="header">
        <div className="title">
          <div className="name">{name}</div>
          <QueueInfo tracks={tracks} />
        </div>
      </div>
      <div className="items">
        <div
          className="item"
          onClick={() => {
            onInsertIntoQueue(tracks);
            onSkipBy(1);
            onPlay();
            onClose();
          }}
        >
          <div className="title">Play Now</div>
        </div>
        <div className="item" onClick={() => { onInsertIntoQueue(tracks); onClose(); }}>
          <div className="title">Play Next</div>
        </div>
        <div className="item" onClick={() => { onAppendToQueue(tracks); onClose(); }}>
          <div className="title">Add to End of Queue</div>
        </div>
        <div className="item" onClick={() => { onReplaceQueue(tracks); onClose(); }}>
          <div className="title">Replace Queue</div>
        </div>
      </div>
      <div className="cancel" onClick={onClose}>Cancel</div>
    </div>
  </div>
);

export const TrackMenu = ({
  track,
  onClose,
  onPlay,
  onSkipBy,
  onReplaceQueue,
  onInsertIntoQueue,
  onAppendToQueue,
}) => (
  <div className="disabler">
    <div className="trackMenu">
      <div className="header">
        <div className="cover" style={{ backgroundImage: `url(/api/cover/${track.persistent_id})` }} />
        <div className="title">
          <div className="name">{track.name}</div>
          <div className="album">{track.artist}{'\u00a0\u2219\u00a0'}{track.album}</div>
        </div>
      </div>
      <div className="items">
        <div
          className="item"
          onClick={() => {
            onInsertIntoQueue([track]);
            onSkipBy(1);
            onPlay([track]);
            onClose();
          }}
        >
          <div className="title">Play Now</div>
        </div>
        <div className="item" onClick={() => { onInsertIntoQueue([track]); onClose(); }}>
          <div className="title">Play Next</div>
        </div>
        <div className="item" onClick={() => { onAppendToQueue([track]); onClose(); }}>
          <div className="title">Add to End of Queue</div>
        </div>
        <div className="item" onClick={() => { onReplaceQueue([track]); onClose(); }}>
          <div className="title">Replace Queue</div>
        </div>
      </div>
      <div className="cancel" onClick={onClose}>Cancel</div>
    </div>
  </div>
);

export const DotsMenu = ({ track, onOpen }) => (
  <div className="dotsmenu" onClick={() => onOpen(track)}>
    {'\u2219\u2219\u2219'}
  </div>
);
