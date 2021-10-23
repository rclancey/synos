import { useMemo, useState, useEffect } from 'react';

export function wrapHistory() {
  if (typeof window === 'undefined') {
    return false;
  }
  if (window.history.isWrapped) {
    return true;
  }
  window.history.isWrapped = true;
  const wrap = function(type) {
    var orig = window.history[type];
    return function() {
      var retval = orig.apply(this, arguments);
      var evt = new Event(type);
      evt.arguments = arguments;
      window.dispatchEvent(evt);
      return retval;
    };
  };
  window.history.pushState = wrap('pushState');
  window.history.replaceState = wrap('replaceState');
};

export const useHistoryState = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const callback = (evt) => {
      setIndex((orig) => orig + 1);
    };
    window.addEventListener('popstate', callback);
    window.addEventListener('pushState', callback);
    window.addEventListener('replaceSTate', callback);
    return () => {
      window.removeEventListener('popstate', callback);
      window.removeEventListener('pushState', callback);
      window.removeEventListener('replaceSTate', callback);
    };
  }, []);
  const historyState = useMemo(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    const doc = {};
    if (typeof document !== 'undefined') {
      if (document.title !== 'Synos') {
        doc.title = document.title;
      }
      doc.pathname = document.location.pathname;
      doc.search = document.location.search;
      doc.hash = document.location.hash;
    }
    const { state = {} } = window.history.state || {};
    return { ...doc, ...state };
  }, [index]);
  return historyState;
};
