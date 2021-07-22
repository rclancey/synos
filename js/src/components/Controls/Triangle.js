import React, { useMemo } from 'react';

const orientations = {
  right: ['Top', 'Bottom', 'Left'],
  left: ['Top', 'Bottom', 'Right'],
  top: ['Left', 'Right', 'Bottom'],
  bottom: ['Left', 'Right', 'Top'],
};

const root3 = Math.sqrt(3);

export const Triangle = ({ orientation, size = 24, ...props }) => {
  const style = useMemo(() => {
    const s = {
      width: 0,
      height: 0,
      touchAction: 'none',
    };
    const ori = orientations[orientation] || orientations.right;
    ori.slice(0, 2).forEach(d => {
      s[`border${d}`] = `solid transparent ${size / root3}px`;
    });
    const d = ori[2];
    s[`border${d}`] = `solid var(--highlight) ${size}px`;
    return s;
  }, [orientation, size]);
  return (<div style={style} {...props} />);
};

export default Triangle;
