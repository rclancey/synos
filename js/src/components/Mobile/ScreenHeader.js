import React, { useMemo, useCallback, useEffect, useState } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { Link, useHistory, useLocation } from 'react-router-dom';

export const Back = () => {
  const { state } = useLocation();
  const history = useHistory();
  const onBack = useCallback((evt) => {
    evt.preventDefault();
    history.goBack();
    return false;
  }, [history]);
  if (state && state.prev) {
    return (
      <a href="/" onClick={onBack}>
        <InnerBack title={state.prev.title || 'Synos'} />
      </a>
    );
  }
  return (
    <Link to="/" title="Synos">
      <InnerBack title="Synos" />
    </Link>
  );
};

const InnerBack = ({ title }) => (
  <div className="back">
    <span className="fas fa-chevron-left" />
    {title}
    <style jsx>{`
      .back {
        display: block;
        text-decoration: none;
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
        color: var(--highlight);
      }
      .fa-chevron-left {
        margin-right: 0.5em;
      }
    `}</style>
  </div>
);

export const ScreenHeader = ({ name, prev, onClose }) => {
  return (
    <div>
      <div className="header">
        <div className="title">{name}</div>
      </div>
      <style jsx>{`
        .header {
          padding: 0.5em;
          padding-top: 54px;
          background-color: var(--contrast3);
        }
        .header .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

