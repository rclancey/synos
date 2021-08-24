import React, { useState, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

export const useTab = (tabs) => {
  const [tab, setTab] = useState(() => tabs[0]);
  const onSelectTab = useCallback(tab => setTab(() => tab), []);
  return [tab, onSelectTab];
};

export const Tabs = ({
  tabs,
  current,
  onChange,
}) => {
  return (
    <div className="tabs">
      { tabs.map((tab, i) => (
        <Tab
          key={i}
          tab={tab}
          selected={tab === current}
          onClick={() => onChange(tab)}
        />
      )) }
      <style jsx>{`
        .tabs {
          border: solid var(--border) 1px;
          border-radius: 4px;
          overflow: hidden;
          width: 100%;
          display: flex;
          margin-bottom: 1em;
        }
        .tabs :global(.tab) {
          flex: 1;
          text-align: center;
          background-color: var(--highlight-blur);
          color: var(--text);
          border-left: solid var(--border) 1px;
          border-right: solid var(--border) 1px;
          font-size: 14px;
          padding: 2px;
          cursor: default;
        }
        .tabs :global(.tab:first-child) {
          border-left: none;
        }
        .tabs :global(.tab:last-child) {
          border-right: none;
        }
        .tabs :global(.tab.selected) {
          background-color: var(--highlight);
          color: var(--inverse);
        }
      `}</style>
    </div>
  );
};

export const Tab = ({
  tab,
  selected,
  onClick,
}) => {
  return (
    <div className={`tab ${selected ? 'selected' : ''}`} onClick={onClick}>
      {tab.name}
    </div>
  );
};
