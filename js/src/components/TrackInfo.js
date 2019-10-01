import React from 'react';
import displayTime from '../lib/displayTime';

export const TrackInfo = ({ track, className }) => (
  <div className={`trackInfo ${className}`}>
    <div className="title">{track.name}</div>
    <div className="artist">
      {track.artist}{' \u2014 '}{track.album}
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
        /*
        border-top-style: solid;
        border-top-width: 1px;
        margin-top: -2px;
        */
      }

      /*
      .trackInfo.desktop.queue {
        padding-top: 5px;
        padding-right: 1em;
      }

      .trackInfo.mobile.queue {
        padding-top: 2px;
      }
      */

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
      }

      .trackInfo.desktop.queue .title {
        font-size: 14px;
        width: 100%;
      }

      .trackInfo.mobile.queue .title {
        font-size: 16px;
        font-size: 14px;
      }

      .trackInfo.controls .artist {
        font-size: 11px;
        padding-bottom: 5px;
      }

      .trackInfo.queue .artist {
        font-size: 12px;
      }

      .trackInfo.desktop.queue .artist {
        width: 100%;
      }

    `}</style>
  </div>
);

export const TrackTime = ({ ms, ...props }) => (
  <div {...props}>{displayTime(ms)}</div>
);

