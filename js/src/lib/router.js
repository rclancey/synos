import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const RouterContext = React.createContext({});

export const WithRouter = ({ state, title, url, children }) => {
  const [history, setHistory] = useState([{ state, title, url }]);
  const pushState = useCallback((state, title, url) => {
    window.history.pushState(state, title, url);
    setHistory((orig) => orig.concat([{ state, title, url }]));
  }, []);
  const popState = useCallback(() => {
    window.history.popState();
  }, []);
  const replaceState = useCallback((state, title, url) => {
    window.history.replaceState(state, title, url);
    setHistory((orig) => orig.slice(0, orig.length - 1).concat([{ state, title, url }]));
  }, []);
  useEffect(() => {
    const handler = (evt) => {
      setHistory((orig) => {
        if (orig.length > 1) {
          return orig.slice(0, orig.length - 1);
        }
        return orig;
      });
    };
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('popstate', handler);
    };
  }, []);
  const ctx = useMemo(() => {
    const current = history[history.length - 1];
    return {
      history,
      ...current,
      pushState,
      popState,
      replaceState,
    };
  }, [history, pushState, popState, replaceState]);
  return (
    <RouterContext.Provider value={ctx}>
      {children}
    </RouterContext.Provider>
  );
};

export default RouterContext;
