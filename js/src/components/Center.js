import React from 'react';
import _JSXStyle from "styled-jsx/style";

export const Center = ({ orientation = 'horizontal', style, children }) => {
  const vert = orientation.substr(0, 1).toLowerCase() === 'v';
  return (
    <div className="center" style={style}>
      <div className="padding" />
      {children}
      <div className="padding" />
      <style jsx>{`
        .center {
          display: flex;
          flex-direction: ${vert ? 'column' : 'row'};
          box-sizing: border-box;
        }
        .padding {
          flex: 10;
        }
      `}</style>
    </div>
  );
};
