import React from 'react';
import _JSXStyle from "styled-jsx/style";

import { REPEAT } from '../../lib/api';

export const RepeatButton = ({ playMode, onRepeat, style }) => {
  return (
    <div
      className={`repeat fas fa-recycle ${playMode & REPEAT ? 'on' : ''}`}
      style={style}
      onClick={onRepeat}
    >
      <style jsx>{`
        .repeat {
          color: var(--text);
        }
        .repeat.on {
          color: var(-highlight);
        }
      `}</style>
    </div>
  );
};

export default RepeatButton;
