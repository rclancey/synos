import React, { useCallback } from 'react';

import Triangle from './Triangle';

export const PlayButton = ({ size, onPlay }) => {
  const onClick = useCallback((evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    onPlay();
  }, [onPlay]);
  return (
    <Triangle
      orientation="right"
      size={size || 24}
      className="play"
      onClick={onClick}
    />
  );
};

export default PlayButton;
