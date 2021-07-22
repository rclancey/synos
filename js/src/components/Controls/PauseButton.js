import React, { useMemo, useCallback } from 'react';

import Triangle from './Triangle';

const root3 = Math.sqrt(3);

export const PauseButton = ({ size, onPause }) => {
  const style = useMemo(() => ({
    width: `${size / 4}px`,
    height: `${size * 2 / root3}px`,
    borderLeft: `solid var(--highlight) ${size * 7 / 24}px`,
    borderRight: `solid var(--highlight) ${size * 7 / 24}px`,
    marginLeft: `${size / 12}px`,
    marginRight: `${size / 12}px`,
  }), [size]);
  const onClick = useCallback((evt) => {
    evt.stopPropagation();
    evt.preventDefault();
    onPause();
  }, [onPause]);
  return (
    <div style={style} className="pause" onClick={onClick} />
  );
};

export default PauseButton;
