import React, { useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";

import RangeInput from './RangeInput';

export const Volume = ({ volume, onChange, ...props }) => {
  const up = useMemo(() => {
    if (volume >= 50) {
      return Math.min(100, volume + 5);
    }
    if (volume >= 25) {
      return Math.min(100, volume + 2);
    }
    return Math.min(100, volume + 1);
  }, [volume]);
  const down = useMemo(() => {
    return Math.max(0, volume - 5);
  }, [volume]);
  return (
    <div className="volumeControl" {...props}>
      <div
        className="fas fa-volume-down"
        onClick={() => onChange(down)}
      />
      <div className="slider">
        <RangeInput
          min={0}
          max={100}
          step={1}
          value={volume || 0}
          style={{ width: '100%' }}
          onInput={evt => onChange(parseInt(evt.target.value))}
        />
      </div>
      <div
        className="fas fa-volume-up"
        onClick={() => onChange(up)}
      />
      <style jsx>{`
        .volumeControl {
          display: flex;
          color: var(--highlight);
        }
        .volumeControl div.fas {
          flex: 1;
        }
        .volumeControl .fa-volume-down {
          text-align: right;
        }
        .volumeControl .slider {
          flex: 10;
          padding-left: 1em;
          padding-right: 1em;
        }
      `}</style>
    </div>
  );
};

export default Volume;
