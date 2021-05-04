import { useState, useEffect, useRef, useCallback } from 'react';

export const useFocus = (onKeyPress) => {
  const [focused, setFocused] = useState(false);
  const focusRef = useRef(focused);
  const node = useRef(null);
  useEffect(() => {
    focusRef.current = focused;
  }, [focused]);
  const focus = useCallback(() => {
    focusRef.current = true;
    setFocused(true);
    if (node.current) {
      node.current.focus();
    }
  }, []);
  const onFocus = useCallback(() => setFocused(true), [setFocused]);
  const onBlur = useCallback(() => setFocused(false), [setFocused]);
  useEffect(() => {
    const handler = (event) => {
      if (focusRef.current && onKeyPress) {
        onKeyPress(event);
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
    };
  }, [onKeyPress]);
  return {
    focused: focusRef,
    node: node,
    focus,
    onFocus,
    onBlur,
  };
};
