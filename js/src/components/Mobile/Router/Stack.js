import React from 'react';
import { useStack } from './StackContext';
import { useTheme } from '../../../lib/theme';
import { Home } from '../Home';

export const Stack = () => {
  const stack = useStack();
  const page = stack.pages[stack.pages.length - 1];
  if (!page) {
    return (
      <>
        <Back />
        <Home />
      </>
    );
  }
  if (!page.title) {
    return (
      <>
        <Back />
        {page.content}
      </>
    );
  }
  return (
    <>
      <Back />
      {page.content}
    </>
  );
};

export const ScreenHeader = () => {
  const colors = useTheme();
  const stack = useStack();
  const page = stack.pages[stack.pages.length - 1];
  const title = page ? page.title : 'Library';
  return (
    <div>
      <Back />
      <div className="header">
        <div className="title">{title}</div>
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
          color: var(--highlight);
        }
      `}</style>
    </div>
  );
};

export const Back = () => {
  const colors = useTheme();
  const stack = useStack();
  const page = stack.pages[stack.pages.length - 2];
  if (!page) {
    return null;
  }
  const prev = stack.pages[stack.pages.length - 2];
  const title = prev ? (prev.title || 'Back') : 'Library';
  return (
    <div className="back" onClick={stack.onPop}>
      <span className="fas fa-chevron-left" />
      {title}
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
          color: var(--highlight);
        }
        .fa-chevron-left {
          margin-right: 0.5em;
        }
      `}</style>
    </div>
  );
};
