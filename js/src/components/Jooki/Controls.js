import React from 'react';
import displayTime from '../../lib/displayTime';
import { PlayPauseSkip, Volume, Progress, ShuffleButton, RepeatButton } from '../Controls';
import { JookiCoverArt } from './CoverArt';
import { TrackInfo } from '../TrackInfo';
import { Center } from '../Center';

const Buttons = ({
  status,
  playMode,
  onPlay,
  onPause,
  onSkipBy,
  onSeekBy,
  onShuffle,
  onRepeat,
}) => (
  <div className="playpause">
    <Center orientation="horizontal" style={{width: '100%'}}>
      <ShuffleButton playMode={playMode} onShuffle={onShuffle} />
      <PlayPauseSkip
        width={150}
        height={24}
        paused={status !== 'PLAYING'}
        onPlay={onPlay}
        onPause={onPause}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
        style={{ flex: 2 }}
      />
      <RepeatButton playMode={playMode} onRepeat={onRepeat} />
    </Center>
    <style jsx>{`
      .playpause {
        display: flex;
        flex: 1;
        flex-direction: row;
        padding: 5px;
      }
      .playpause :global(.shuffle), .playpause :global(.repeat) {
        flex: 1;
        line-height: 24px;
        margin-left: 1em;
        margin-right: 1em;
      }
      .playpause :global(.repeat) {
        text-align: right;
      }
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
  center,
}) => {
  const {
    queue,
    index,
    playStatus,
    currentTime,
    duration,
    volume,
    playMode,
  } = playbackInfo;
  const {
    onPlay,
    onPause,
    onSkipTo,
    onSkipBy,
    onSeekTo,
    onSeekBy,
    onSetVolumeTo,
    onShuffle,
    onRepeat,
  } = controlAPI;
  const track = queue ? queue[index] : null;
  return (
    <>
      { center ? (
        <Center orientation="horizontal" style={{ width: '100%' }}>
          <JookiCoverArt track={track} size={194} radius={0} />
        </Center>
      ) : (
        <JookiCoverArt track={track} size={194} radius={0} />
      ) }
      <div className="jooki controls">
        <NowPlaying
          track={track}
          currentTime={currentTime}
          duration={duration}
          onSeekTo={onSeekTo}
        />
        <Buttons
          status={playStatus}
          playMode={playMode}
          onPlay={onPlay}
          onPause={onPause}
          onSkipBy={onSkipBy}
          onSeekBy={onSeekBy}
          onShuffle={onShuffle}
          onRepeat={onRepeat}
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
            max-width: 500px;
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
