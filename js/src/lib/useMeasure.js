import { useState, useEffect, useRef } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

export const useMeasure = (w, h) => {
  const node = useRef(null);
  const obs = useRef(null);
  const [width, setWidth] = useState(w);
  const [height, setHeight] = useState(h);
  if (obs.current === null) {
    obs.current = new ResizeObserver((entries, observer) => {
      const entry = entries[0];
      if (entry) {
        const cr = entry.contentRect;
        if (Math.abs(cr.width - width) >= 3) {
          setWidth(cr.width);
        }
        if (Math.abs(cr.height - height) >= 3) {
          setHeight(cr.height);
        }
      }
    });
  }
  const setNode = (n) => {
    if (n && node.current != n) {
      obs.current.disconnect();
      obs.current.observe(n);
      node.current = n;
      if (Math.abs(n.offsetWidth - width) >= 3) {
        setWidth(n.offsetWidth);
      }
      if (Math.abs(n.offsetHeight - height) >= 3) {
        setHeight(n.offsetHeight);
      }
    }
  };
  useEffect(() => {
    return () => {
      if (obs.current !== null) {
        obs.current.disconnect();
        obs.current = null;
      }
      node.current = null;
    };
  }, []);
  return [
    width,
    height,
    setNode,
  ];
};
