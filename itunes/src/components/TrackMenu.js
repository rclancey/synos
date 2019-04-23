import React from 'react';

export const TrackMenu = ({
  track,
  onClose,
  onPlay,
  onQueueNext,
  onQueue,
  onReplaceQueue,
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
        <div className="item" onClick={() => onPlay([track])}>
          <div className="title">Play Now</div>
        </div>
        <div className="item" onClick={() => onQueueNext([track])}>
          <div className="title">Play Next</div>
        </div>
        <div className="item" onClick={() => onQueue([track])}>
          <div className="title">Add to End of Queue</div>
        </div>
        <div className="item" onClick={() => onReplaceQueue([track])}>
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
