import React, { useCallback } from 'react';

export const RangeInput = ({ value, min, max, ...props }) => {
  const pct = 100 * (value - min) / (max - min);
  return (
    <span>
      <style jsx>{`
        --webkit-progress-percent: ${pct}%;
      `}</style>
      <input type="range" value={value} min={min} max={max} {...props} />
    </span>
  );
};

export default RangeInput;
