import React, { useCallback } from 'react';
import displayTime from '../lib/displayTime';

export const TrackInfo = ({ track, className, onList }) => {
  const onListArtist = useCallback(() => {
    if (track && onList) {
      onList({ artist: track });
    }
  }, [track, onList]);
  const onListAlbum = useCallback(() => {
    if (track && onList) {
      onList({ album: track });
    }
  }, [track, onList]);
  return (
  <div className={`trackInfo ${className}`}>
    <div className="title">{track ? track.name : '--'}</div>
    <div className="artist">
      { track ? (
        <>
          <span onClick={onListArtist}>{track.artist}</span>
          {' \u2014 '}
          <span onClick={onListAlbum}>{track.album}</span>
        </>
      ) : '\u2014' }
    </div>
    <style jsx>{`
      .trackInfo {
        overflow: hidden;
      }

      .trackInfo.controls {
        flex: 100;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .trackInfo.desktop.controls {
        text-align: center;
      }

      .trackInfo.mobile.controls {
        padding-left: 1em;
        text-align: left;
      }

      .trackInfo.queue {
        flex: 10;
        display: flex;
        flex-direction: column;
      }


      .title, .artist {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .trackInfo.controls .title {
        font-size: 14px;
        padding-top: 5px;
        flex: 2;
      }

      .trackInfo.queue .title {
        font-weight: bold;
        width: 100%;
      }

      /*
      .trackInfo.desktop.queue .title {
        font-size: 14px;
        width: 100%;
      }

      .trackInfo.mobile.queue .title {
        font-size: 16px;
        font-size: 14px;
      }
      */

      .trackInfo.controls .artist {
        font-size: 11px;
        padding-bottom: 5px;
      }

      .trackInfo.queue .artist {
        font-size: 12px;
        width: 100%;
      }

      /*
      .trackInfo.desktop.queue .artist {
        width: 100%;
      }
      */

    `}</style>
  </div>
);
};

export const TrackTime = ({ ms, ...props }) => (
  <div {...props}>
    <style jsx>{`
      font-variant: tabular-nums;
    `}</style>
    {displayTime(ms)}
  </div>
);

