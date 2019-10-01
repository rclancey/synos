import React from 'react';
import { useTheme } from '../../lib/theme';

export const Back = ({ onClose, children }) => {
  const colors = useTheme();
  return (
    <div className="back" onClick={onClose}>
      <span className="fas fa-chevron-left" />
      {children}
      <style jsx>{`
        .back {
          background-size: contain;
          background-repeat: no-repeat;
          padding: 3px 6px 3px 6px;
          border-left: solid transparent 6px;
          border-top: solid transparent 12px;
          border-bottom: solid transparent 12px;
          position: fixed;
          z-index: 2;
          width: 100vw;
          box-sizing: border-box;
          font-size: 18px;
          font-weight: bold;
          color: ${colors.highlightText};
        }
        .fa-chevron-left {
          margin-right: 0.5em;
        }
      `}</style>
    </div>
  );
};

export const ScreenHeader = ({ name, prev, onClose }) => {
  const colors = useTheme();
  return (
    <div>
      <Back onClose={onClose}>{prev}</Back>
      <div className="header">
        <div className="title">{name}</div>
      </div>
      <style jsx>{`
        .header {
          padding: 0.5em;
          padding-top: 54px;
          background-color: ${colors.sectionBackground};
        }
        .header .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          color: ${colors.highlightText};
        }
      `}</style>
    </div>
  );
};

