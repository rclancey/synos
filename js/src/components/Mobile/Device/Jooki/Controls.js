import React from 'react';
import displayTime from '../../../../lib/displayTime';
import { PlayPauseSkip, Volume, Progress } from '../../../Controls';
import { JookiCoverArt } from './CoverArt';
import { TrackInfo } from '../../../TrackInfo';
import { Center } from '../../../Center';

const Buttons = ({
  status,
  onPlay,
  onPause,
  onSkipBy,
  onSeekBy,
}) => (
  <div className="playpause">
    <Center orientation="horizontal" style={{width: '100%'}}>
      <PlayPauseSkip
        width={150}
        height={24}
        paused={status !== 'PLAYING'}
        onPlay={onPlay}
        onPause={onPause}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
      />
    </Center>
    <style jsx>{`
      .playpause {
        display: flex;
        flex: 1;
        flex-direction: row;
        padding: 5px;
      }
      /*
      .playpause :global(.rewind),
      .playpause :global(.ffwd) {
        padding: 5px;
        margin-left: 1em;
        margin-right: 1em;
      }
      .wrapper {
        display: flex;
        flex-direction: row;
        padding-left: 0;
        flex: 10;
      }
      .padding {
        flex: 2;
      }
      */
    `}</style>
  </div>
);

const Timer = ({ t, align = 'left' }) => (
  <div className="timer">
    <div className="padding" />
    <div className="currentTime">{displayTime(t)}</div>
    <style jsx>{`
      .timer {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: auto;
        min-width: 50px;
        max-width: 50px;
      }
      .padding {
        flex: 100;
      }
      .currentTime {
        flex: 1;
        min-height: 14px;
        max-height: 14px;
        font-size: 11px;
        text-align: ${align};
      }
    `}</style>
  </div>
);

const NowPlaying = ({
  track,
  currentTime,
  duration,
  onSeekTo,
}) => {
  if (!track) {
    return null;
  }
  return (
    <div className="nowplaying">
      <div className="outerwrapper">
        <div className="padding" />
        <div className="innerwrapper">
          <Timer t={currentTime} />
          <TrackInfo track={track} />
          <Timer t={currentTime - duration} align="right" />
        </div>
        <Progress currentTime={currentTime} duration={duration} onSeekTo={onSeekTo} height={4} />
      </div>
      <style jsx>{`
        .nowplaying {
          width: 100%;
          flex: 2;
          border: none;
          overflow: hidden;
          padding: 5px;
          box-sizing: border-box;
        }
        .outerwrapper {
          flex: 100;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 1em;
        }
        .padding {
          flex: 5;
        }
        .innerwrapper {
          flex: 100;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          margin-bottom: 5px;
        }
      `}</style>
    </div>
  );
};

export const JookiControls = ({
  playbackInfo,
  controlAPI,
}) => {
  const {
    queue,
    index,
    playStatus,
    currentTime,
    duration,
    volume,
  } = playbackInfo;
  const {
    onPlay,
    onPause,
    onSkipTo,
    onSkipBy,
    onSeekTo,
    onSeekBy,
    onSetVolumeTo,
  } = controlAPI;
  console.debug('controlAPI = %o', controlAPI);
  const track = queue ? queue[index] : null;
  return (
    <>
      <Center orientation="horizontal" style={{ width: '100%' }}>
        <JookiCoverArt track={track} size={194} radius={0} />
      </Center>
      <div className="jooki controls">
        <NowPlaying
          track={track}
          currentTime={currentTime}
          duration={duration}
          onSeekTo={onSeekTo}
        />
        <Buttons
          status={playStatus}
          onPlay={onPlay}
          onPause={onPause}
          onSkipBy={onSkipBy}
          onSeekBy={onSeekBy}
        />
        <Volume
          volume={volume}
          onChange={onSetVolumeTo}
        />
        <style jsx>{`
          .controls {
            flex: 1;
            display: flex;
            flex-direction: column;
            /*
            max-width: 400px;
            padding-right: 1em;
            */
            height: auto;
            max-height: none;
          }
          .controls .padding {
            flex: 100;
          }
          .controls :global(.volumeControl) {
            flex: 2;
            padding: 5px;
          }
        `}</style>
      </div>
    </>
  );
};
