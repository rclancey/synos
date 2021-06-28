import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const RouterContext = React.createContext({});

export const useRouter = () => {
  const [history, setHistory] = useState([]);
  const pushState = useCallback((state, title) => setHistory((orig) => orig.concat([{ state, title }])), []);
  const popState = useCallback(() => setHistory((orig) => {
    if (orig.length > 1) {
      return orig.slice(0, orig.length - 1);
    }
    return orig;
  }), []);
  const replaceState = useCallback((state, title) => setHistory((orig) => {
    if (orig.length <= 1) {
      return [{ state, title }];
    }
    return orig.slice(0, orig.length - 1).concat([{ state, title }]);
  }), []);
  const current = history.length === 0 ? {} : history[history.length - 1];
  const { state, title } = current;
  const prev = history.length > 1 ? history[history.length - 2] : {};
  const { title: prevTitle } = prev;
  const ctx = useMemo(() => ({
    history,
    state,
    title,
    prevTitle,
    pushState,
    popState,
    replaceState,
  }), [
    history,
    state,
    title,
    prevTitle,
    pushState,
    popState,
    replaceState,
  ]);
  return ctx;
};

export default RouterContext;
