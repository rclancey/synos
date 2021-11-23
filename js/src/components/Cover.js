import React, { useEffect, useState } from 'react';
import _JSXStyle from "styled-jsx/style";

export const Cover = ({ active = true, zIndex, onClear, children }) => {
  return (
    <div
      className={`cover ${active ? 'active' : ''}`}
      style={{ zIndex }}
      onClick={evt => {
        if (onClear) {
          evt.preventDefault();
          evt.stopPropagation();
          onClear();
        }
      }}
    >
      {children}
      <style jsx>{`
        .cover {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0);
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(0px);
          transition: background-color ease-out 0.1s, backdrop-filter ease-out 0.1s;
          pointer-events: none;
        }
        .cover.active {
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(1px);
          pointer-events: all;
        }
      `}</style>
    </div>
  );
};

