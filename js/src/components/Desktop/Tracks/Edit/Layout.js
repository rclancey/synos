import React from 'react';
import _JSXStyle from 'styled-jsx/style';

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
  return (
    <div className="value">
      {children}
      <style jsx>{`
        .value {
          margin-right: 3em;
          line-height: 23px;
        }
        /*
        .value :global(input) {
          border: solid var(--border) 1px;
          color: var(--text);
          background-color: var(--gradient-end);
          font-size: 12px;
          padding: 2px;
          margin: 1px;
        }
        .value :global(select) {
          background: var(--gradient-end);
          color: var(--text);
        }
        */
        .value :global(input[type="text"]) {
          width: calc(100% - 24px);
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};
