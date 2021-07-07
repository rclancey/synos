import React from 'react';
import _JSXStyle from "styled-jsx/style";
import { Icon } from './Icon';

export const SVGIcon = ({ icn, size }) => {
  if (typeof icn === 'string') {
    console.debug('icn is a string: %o', icn);
    return <Icon src={icn} size={size} />;
  }
  const SVG = icn;
  return (
    <div className="svgIcon">
      <style jsx>{`
        .svgIcon {
          width: ${size}px;
          height: ${size}px;
          color: var(--highlight-muted);
        }
        :global(.svgIcon svg) {
          max-width: ${size}px;
          max-height: ${size}px;
        }
      `}</style>
      <SVG />
    </div>
  );
};

export default SVGIcon;
