import React from 'react';
import _JSXStyle from 'styled-jsx/style';

export const Grid = ({ cols = 2, className = '', children, ...props }) => (
  <div className={`grid ${className}`} {...props}>
    <style jsx>{`
      .grid {
        display: grid;
        grid-template-columns: min-content ${' auto'.repeat(cols - 1)};
        column-gap: 4px;
        row-gap: 10px;
        align-items: baseline;
      }
      .grid>:global(div) {
        white-space: nowrap;
      }
      .grid>:global(div[colspan]) {
        grid-column: span 2;
      }
    `}</style>
    {children}
  </div>
);

export default Grid;
