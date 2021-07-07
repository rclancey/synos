import React, { useState, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useTheme } from '../../../../lib/theme';

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
  const colors = useTheme();
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
          border: solid ${colors.text} 1px;
          border-radius: 4px;
          overflow: hidden;
          width: 100%;
          display: flex;
          margin-bottom: 1em;
        }
        .tabs :global(.tab) {
          flex: 1;
          text-align: center;
          background-color: ${colors.tabBackground};
          color: ${colors.tabColor};
          border-left: solid ${colors.text} 1px;
          border-right: solid ${colors.text} 1px;
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
          background-color: ${colors.highlightText};
          color: ${colors.highlightInverse};
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
