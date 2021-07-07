import React from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useTheme } from '../../../../lib/theme';

export const Grid = ({ children }) => (
  <div className="grid">
    {children}
    <style jsx>{`
      .grid {
        display: grid;
        grid-template-columns: auto auto;
        font-size: 12px;
      }
    `}</style>
  </div>
);

export const GridRow = ({ label, children }) => (
  <>
    <GridKey>{label}</GridKey>
    <GridValue>{children}</GridValue>
  </>
);

export const GridSpacer = () => (
  <GridRow label={'\u00a0'} />
);

export const GridKey = ({ children }) => (
  <div className="key">
    {children}
    <style jsx>{`
      .key {
        text-align: right;
        margin-left: 3em;
        margin-right: 1em;
        line-height: 23px;
      }
    `}</style>
  </div>
);

export const GridValue = ({ children }) => {
  const colors = useTheme();
  return (
    <div className="value">
      {children}
      <style jsx>{`
        .value {
          margin-right: 3em;
          line-height: 23px;
        }
        .value :global(input) {
          border: solid ${colors.inputGradient} 1px;
          color: ${colors.input};
          background-color: ${colors.inputBackground};
          font-size: 12px;
          padding: 2px;
          margin: 1px;
        }
        .value :global(input[type="text"]) {
          width: calc(100% - 24px);
        }
      `}</style>
    </div>
  );
};
