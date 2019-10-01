import React, { useState, useEffect, useMemo } from 'react';
//import { useDrag, useDrop } from 'react-dnd';
import { DotsMenu } from './TrackMenu';
import { CoverArt } from '../CoverArt';
import { AddIcon, DeleteIcon } from './ActionIcon';
import { useTheme } from '../../lib/theme';

export const SongRow = ({
  style,
  index,
  len,
  playlist,
  track,
  withTrackNum = false,
  withCover = false,
  withArtist = false,
  withAlbum = false,
  editing = false,
  adding = false,
  onTrackMenu,
  onAdd,
  onMove,
  onDelete,
}) => {
  const colors = useTheme();
  /*
  const [dragCollect, connectDragSource, preview] = useDrag({
    item: {
      type: 'Track',
      playlist,
      track,
      origIndex: index,
    },
    begin(monitor) {
      console.debug('begin drag');
    },
    collect(monitor) {
      return {
        opacity: monitor.isDragging() ? 0.4 : 1,
      };
    },
    isDragging(monitor) {
      return monitor.getItem().track === track;
    },
  });
  const [dropCollect, connectDropTarget] = useDrop({
    accept: ['Track'],
    drop(item, monitor) {
      if (onMove) {
        onMove(item, index);
      }
    },
    collect(monitor, props) {
      return {
        isOver: monitor.isOver(),
      };
    },
  });
  return connectDropTarget(
  */
  return (
    <div className={`item ${editing ? 'editing' : ''}`} style={style}>
      { editing ? (
        <DeleteIcon size={36} onDelete={() => onDelete(track, index)} />
      ) : null }
      { adding ? (
        <AddIcon size={36} onAdd={() => onAdd(track)} />
      ) : null }
      { withCover ? (
        <CoverArt track={track} size={48} radius={4} />
      ) : null }
      <div className="title">
        { withTrackNum ? (
          <div className="tracknum">{track.track_number}</div>
        ) : null }
        <div className="songArtistAlbum">
          <div className="song">{track.name}</div>
          { (withArtist || track.compilation || (track.album_artist && track.album_artist !== track.artist)) ? (
            <div className="artist">
              {track.artist}
              { withAlbum ? `\u00a0\u2219\u00a0${track.album}` : ''}
            </div>
          ) : null }
        </div>
      </div>
      { editing ? (
        <div className="move">
          <div
            className={`fas fa-angle-up ${index === 0 ? 'disabled' : ''}`}
            onClick={() => {
              if (index > 0) {
                onMove(index, index - 1, -1);
              }
            }}
          />
          <div
            className={`fas fa-angle-down ${index >= len - 1 ? 'disabled' : ''}`}
            onClick={() => {
              if (index < len - 1) {
                onMove(index + 1, index, 1);
              }
            }}
          />
        </div>
      ) : adding ? null : (
        <DotsMenu track={track} onOpen={onTrackMenu} />
      ) }

      <style jsx>{`
        .item {
          display: flex;
          padding: 9px 9px 0px 9px;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }
        .item.editing {
          border-bottom: solid ${colors.trackList.border} 1px;
        }
        .fa-bars {
          line-height: 44px;
        }
        .icon {
          margin-top: 4px;
        }
        .title {
          flex: 10;
          display: flex;
          font-size: 18px;
          padding: 5px 0px 0px 0px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-left: 9px;
        }
        .title .song {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .title .artist {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 14px;
        }
        .songArtistAlbum {
          flex: 10;
        }
        .tracknum {
          flex: 1;
          width: 24px;
          min-width: 24px;
          max-width: 24px;
          margin-right: 0.5em;
          font-size: 18px;
          text-align: right;
        }
        .move {
          display: flex;
          flex-direction: column;
          color: ${colors.highlightText};
        }
        .move .disabled {
          color: ${colors.text};
        }
      `}</style>
    </div>
  );
};
