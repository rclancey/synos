import React from 'react';

export const Switch = ({ on, onToggle }) => (
  <div className={`switch ${on ? 'on' : 'off'}`} onClick={() => onToggle(!on)}>
    <div className="onbg">
      <div className="knob" />
    </div>
  </div>
);

