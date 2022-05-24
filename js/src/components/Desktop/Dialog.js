import React, { useState, useRef, useMemo, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import css from 'styled-jsx/css';

import { Cover } from '../Cover';
import Button from '../Input/Button';

export const Alert = ({ title, style, children, onDismiss }) => {
  return (
    <Dialog
      title={title}
      style={style}
    >
      {children}
      <ButtonRow>
        <Padding />
        <Button onClick={onDismiss}>OK</Button>
      </ButtonRow>
    </Dialog>
  );
};

export const Dialog = ({
  title,
  width,
  style,
  children,
  onDismiss,
}) => {
  const [pos, setPos] = useState(null);
  const xstyle = useMemo(() => {
    if (pos === null) {
      return style;
    }
    return Object.assign({}, style, { top: `${pos.top}px`, left: `${pos.left}px` });
  }, [style, pos]);
  return (
    <>
      <Cover zIndex={10} onClear={onDismiss} />
      <div className="dialog" style={xstyle}>
        <DialogHeader setPos={setPos}>{title}</DialogHeader>
        <div className="body">
          {children}
        </div>
        <style jsx>{`
          .dialog {
            position: fixed;
            z-index: 11;
            left: calc(50vw - ${width ? width / 2 : 300}px);
            width: ${width ? `${width}px` : 'auto'};
            top: 25vh;
            height: auto;
            max-height: 73vh;
            overflow: hidden;
            background: var(--gradient);
            border: solid var(--border) 1px;
            border-radius: 8px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .dialog .body {
            flex: 10;
            overflow: overlay;
            padding: 1em;
          }
        `}</style>
      </div>
    </>
  );
};

export const DialogHeader = ({
  setPos,
  children,
}) => {
  let css;
  if (typeof children === 'string') { // || (Array.isArray(children) && children.every(c => typeof c === 'string'))) {
    css = titleHeaderCss();
  } else {
    css = complexHeaderCss();
  }
  const ref = useRef(null);

  const onMove = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    const x = evt.clientX;
    const y = evt.clientY;
    setPos(orig => {
      if (orig === null) {
        return orig;
      }
      const dx = x - orig.x;
      const dy = y - orig.y;
      return {
        top: orig.top + dy,
        left: orig.left + dx,
        x: x,
        y: y,
      };
    });
  }, [setPos]);

  const onEnd = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onEnd);
  }, [onMove]);

  const onStart = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    let start = ref.current.parentNode.getBoundingClientRect();
    start = { top: start.top, left: start.left, x: evt.clientX, y: evt.clientY };
    setPos(start);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
  }, [setPos, onMove, onEnd]);

  return (
    <div
      ref={ref}
      className="header"
      onMouseDown={onStart}
    >
      {children}
      <style jsx>{css}</style>
    </div>
  );
};

const titleHeaderCss = () => {
  return css`
  .header {
    flex: 0;
    font-size: 14px;
    line-height: 18px;
    min-height: 18px;
    max-height: 18px;
    height: 18px;
    text-align: center;
    font-weight: bold;
    background-color: var(--contrast5);
    padding: 0.5em;
    cursor: move;
    border-bottom: solid var(--gradient-start) 1px;
  }
  `;
};

const complexHeaderCss = () => {
  return css`
  .header {
    flex: 0;
    background-color: var(--contrast5);
    border-bottom: solid var(--gradient-start) 1px;
    padding: 1em;
    display: flex;
    cursor: move;
  }
  `;
};

export const ButtonRow = ({ children }) => {
  return (
    <div className="buttons">
      {children}
      <style jsx>{`
        .buttons {
          margin-top: 1em;
          display: flex;
        }
      `}</style>
    </div>
  );
};

export const Padding = ({ flex = 10 }) => {
  return (<div style={{ flex }} />);
};
