import React from 'react';
import _JSXStyle from 'styled-jsx/style';

export const Button = ({ type = 'primary', children, ...props }) => (
  <button type={type} {...props}>
    <style jsx>{`
      button {
        font-size: var(--font-size-normal);
        line-height: 17px;
        font-weight: 500;
        border: solid var(--highlight) 1px;
        border-radius: 6px;
        background: var(--gradient-end);
        color: var(--text);
        padding: 3px 10px;
        outline: none;
        cursor: pointer;
        white-space: nowrap;
      }
      button[disabled] {
        background: var(--highlight-blur);
        border-color: var(--border);
        color: var(--border);
        pointer-events: none;
      }
      button[type="primary"] {
        background: linear-gradient(var(--gradient-start), var(--gradient-end));
        color: var(--highlight);
        font-weight: 700;
        border-width: 2px;
        border-color: var(--highlight);
        padding: 2px 9px;
      }
      button[type="text"] {
        border-color: transparent !important;
        background: transparent !important;
      }
      button:not(:last-child) {
        margin-right: 6px;
      }
    `}</style>
    {children}
  </button>
);

export default Button;
