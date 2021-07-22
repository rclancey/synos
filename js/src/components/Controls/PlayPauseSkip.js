import React, { useMemo, useRef } from 'react';
import _JSXStyle from "styled-jsx/style";

import PlayPauseButton from './PlayPauseButton';
import RewindButton from './RewindButton';
import FastForwardButton from './FastForwardButton';

const root3 = Math.sqrt(3);

export const PlayPauseSkip = ({ width, height, paused, onPlay, onPause, onSkipBy, onSeekBy, ...props }) => {
  return (
    <div className="playPauseSkip" {...props}>
      <RewindButton
        size={height * 0.625}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
      />
      <div className="padding" />
      <PlayPauseButton
        size={height}
        paused={paused}
        onPlay={onPlay}
        onPause={onPause}
      />
      <div className="padding" />
      <FastForwardButton
        size={height * 0.625}
        onSkipBy={onSkipBy}
        onSeekBy={onSeekBy}
      />
      <style jsx>{`
        .playPauseSkip {
          display: flex;
          height: ${2 * height / root3}px;
          width: ${width ? `${width}px` : '100%'};
          min-width: ${width ? `${width}px` : '100%'};
          display: flex;
          flex-direction: row;
        }
        .playPauseSkip .padding {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default PlayPauseSkip;
