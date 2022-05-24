import React from 'react';
import _JSXStyle from "styled-jsx/style";

export const ColumnMenu = ({ avail, onToggle, pos }) => (
  <div className="options">
    {avail.map((col) => (
      <div key={col.key} className="option" data-key={col.key} onClick={onToggle}>
        <div className={col.selected ? 'selected' : 'deselected'}>{'\u2713'}</div>
        <div className="label">{col.label}</div>
      </div>
    ))}
    <style jsx>{`
      .options {
        position: absolute;
        left: ${pos.x}px;
        top: ${pos.y}px;
        z-index: 10;
        width: min-content;
        background: var(--gradient);
        border-style: solid;
        border-width: 1px;
        border-color: var(--border);
        border-radius: 5px;
        max-height: 60vh;
        min-width: 150px;
        overflow: overlay;
      }
      .options .option {
        width: min-content;
        padding: 3px;
        display: flex;
        flex-direction: row;
        width: 100%;
        cursor: pointer;
        padding: 0px 4px;
      }
      .options .option:hover {
        background: var(--contrast5);
        font-weight: bold;
      }
      .options .option .selected {
        text-align: center;
        width: 25px;
        font-weight: bold;
      }
      .options .option .deselected {
        width: 25px;
        color: transparent;
      }
      .options .option .label {
        white-space: nowrap;
      }
    `}</style>
  </div>
);

export default ColumnMenu;
