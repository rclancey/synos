import React, { useMemo, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { SHUFFLE } from '../../../lib/api';
import { Button } from '../../Input/Button';
import { Triangle } from '../../Controls/Triangle';
import { TrackTime } from '../../TrackInfo';
import { CoverArt } from '../../CoverArt';

export const Controls = ({ tracks, playback, controlAPI }) => {
  const onPlay = useCallback(async () => {
    if (playback.playStatus !== 'PAUSED') {
      await controlAPI.onPause();
    }
    if (playback.playMode === SHUFFLE) {
      await controlAPI.onShuffle();
    }
    await controlAPI.onReplaceQueue(tracks);
    await controlAPI.onPlay();
  }, [playback, controlAPI, tracks]);
  const onShuffle = useCallback(async () => {
    if (playback.playStatus !== 'PAUSED') {
      await controlAPI.onPause();
    }
    if (playback.playMode !== SHUFFLE) {
      await controlAPI.onShuffle();
    }
    await controlAPI.onReplaceQueue(tracks);
    await controlAPI.onPlay();
  }, [playback, controlAPI, tracks]);

  return (
    <div className="controls">
      <style jsx>{`
        .controls {
          margin-bottom: 20px;
        }
        .controls :global(.play) {
          display: inline-block;
        }
      `}</style>
      <Button onClick={onPlay}>
        <Triangle orientation="right" size={10} className="play" />
        {' Play'}
      </Button>
      <Button onClick={onShuffle}>
        <span className="fas fa-random" />
        {' Shuffle'}
      </Button>
    </div>
  );
};

const Song = ({ track, compilation, withCover, onPlay }) => (
  <div className="song">
    <style jsx>{`
      .song {
        display: flex;
        border-bottom: solid var(--border) 1px;
        align-items: center;
        padding-top: 5px;
        padding-bottom: 5px;
        min-height: 32px;
        font-size: 12px;
        overflow-x: hidden;
      }
      .song:hover {
        background-color: var(--contrast4);
      }
      .song .trackNum, .song .cover {
        flex: 0;
        min-width: 32px;
        max-width: 32px;
        text-align: right;
      }
      .song .play {
        flex: 0;
        min-width: 32px;
        max-width: 32px;
        color: var(--highlight);
        cursor: pointer;
        display: none;
        text-align: right;
      }
      .song .play.withCover {
        text-align: center;
      }
      .song:hover .trackNum, .song:hover .cover {
        display: none;
      }
      .song:hover .play {
        display: block;
      }
      .song .play :global(.triangle) {
        display: inline-block;
      }
      .song .name {
        flex: 10;
        padding-left: 10px;
        padding-right: 10px;
        overflow-x: hidden;
      }
      .song .name .title,
      .song .name .artist {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow-x: hidden;
      }
      .song .name .title {
        font-weight: 600;
      }
      .song :global(.time) {
        padding-right: 10px;
      }
    `}</style>
    { withCover ? (
      <div className="cover">
        <CoverArt track={track} size={32} />
      </div>
    ) : (
      <div className="trackNum">{track.track_number}</div>
    ) }
    <div
      className={`play ${withCover ? 'withCover' : ''}`}
      onClick={() => onPlay(track)}
    >
      <Triangle orientation="right" size={10} className="triangle" />
    </div>
    <div className="name">
      <div className="title">{track.name}</div>
      { compilation ? (
        <div className="artist">{track.artist}</div>
      ) : null }
    </div>
    { withCover ? (
      <div className="name">{track.album}</div>
    ) : null }
    <TrackTime ms={track.total_time} className="time" />
  </div>
);

export const Songs = ({ tracks, withCover, playback, controlAPI }) => {
  const multiDisc = useMemo(() => {
    const discs = tracks.map((track) => track.disc_count || track.disc_number || 1);
    return Math.max(...discs) > 1;
  }, [tracks]);
  const compilation = useMemo(() => {
    const artists = new Set(tracks.map((tr) => [tr.artist, tr.album_artist])
      .flat()
      .filter((artist) => artist)
    );
    return artists.size > 1;
  }, [tracks]);
  const onPlay = useCallback(async (track) => {
    let idx = playback.queueOrder.findIndex((i) => playback.queue[i].persistent_id === track.persistent_id);
    if (idx >= 0) {
      await controlAPI.onSkipTo(idx);
      //await controlAPI.onPlay();
    } else {
      console.debug('track %o not found in %o', track, playback.queueOrder);
      idx = tracks.findIndex((item) => item.persistent_id === track.persistent_id);
      if (idx >= 0) {
        await controlAPI.onPause();
        if (playback.playMode === SHUFFLE) {
          await controlAPI.onShuffle();
        }
        await controlAPI.onReplaceQueue(tracks);
        await controlAPI.onSkipTo(idx);
        await controlAPI.onPlay();
      } else {
        console.debug('track %o not found in %o', track, tracks);
      }
    }
  }, [playback, controlAPI, tracks]);
  return (
    <div className="songs">
      <style jsx>{`
        .songs {
          border-top: solid var(--border) 1px;
          overflow-x: hidden;
        }
        .songs .discnum {
          margin-top: 24px;
          color: var(--muted-text);
          text-transform: uppercase;
          font-weight: 600;
          font-size: 12px;
          border-bottom: solid var(--border) 1px;
          padding-bottom: 10px;
        }
      `}</style>
      { tracks.map((track, i) => (
        <>
          { (!withCover && multiDisc && (i === 0 || track.disc_number !== tracks[i-1].disc_number)) ? (
            <div className="discnum">{`Disc ${track.disc_number}`}</div>
          ) : null }
          <Song
            key={track.persistent_id}
            track={track}
            compilation={compilation}
            withCover={withCover}
            onPlay={onPlay}
          />
        </>
      )) }
    </div>
  );
};

export default Songs;
