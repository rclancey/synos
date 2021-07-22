import React from 'react';
import _JSXStyle from "styled-jsx/style";

import { SHUFFLE } from '../../lib/api';

export const ShuffleButton = ({ playMode, onShuffle, style }) => {
  return (
    <div
      className={`shuffle fas fa-random ${playMode & SHUFFLE ? 'on' : ''}`}
      style={style}
      onClick={onShuffle}
    >
      <style jsx>{`
        .shuffle {
          color: var(--text);
        }
        .shuffle.on {
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export default ShuffleButton;
