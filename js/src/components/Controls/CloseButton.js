import React from 'react';
import _JSXStyle from "styled-jsx/style";

export const CloseButton = ({ onClose, style }) => {
  return (
    <div className="close fas fa-times" onClick={onClose} style={style}>
      <style jsx>{`
        .close {
          color: var(--highlight);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default CloseButton;
