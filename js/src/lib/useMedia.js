import { useState, useRef, useEffect } from 'react';

export const useMedia = (query) => {
  const [match, setMatch] = useState(false);
  const mql = useRef(null);
  if (mql.current === null) {
    if (typeof window !== 'undefined' && window.matchMedia) {
      mql.current = window.matchMedia(query);
      mql.current.onchange = evt => setMatch(evt.matches);
      setMatch(mql.current.matches);
    }
  }
  return match;
};

export const getUserAgent = () => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) {
    return window.navigator.userAgent;
  }
  return 'unknown';
};

export const isMobile = (ua) => {
  if (ua.match(/iPhone|iPad/)) {
    return true;
  }
  return false;
};

export const useMobile = () => {
  const [mobile, setMobile] = useState(isMobile(getUserAgent()));
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => setMobile(isMobile(getUserAgent())));
    }
  }, []);
  return mobile;
};

export const useDarkMode = () => {
  const query = '(prefers-color-scheme: dark)';
  const dark = useMedia(query);
  const mobile = useMobile();
  return dark || mobile;
};

export const usePWA = () => {
  const val = useMedia('(display-mode: standalone)');
  if (typeof window === 'undefined') {
    return false;
  }
  if (window.navigator && window.navigator.standalone) {
    return true;
  }
  return val;
};

