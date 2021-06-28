import React from 'react';

export const Cover = ({ zIndex, onClear, children }) => {
  return (
    <div
      className="cover"
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
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
      `}</style>
    </div>
  );
};

