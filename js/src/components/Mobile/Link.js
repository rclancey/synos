import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

export const Link = ({ title, to, replace, back, onClick, children, component, ...props }) => {
  const history = useHistory();
  const myOnClick = useCallback((evt) => {
    if (onClick) {
      onClick(evt);
    }
    if (evt.defaultPrevented) {
      return;
    }
    evt.preventDefault();
    if (back) {
      history.goBack();
      return;
    }
    const { location } = history;
    let { state } = location;
    if (!state) {
      state = {
        title: document.title,
        path: location.pathname,
        search: location.search,
        hash: location.hash,
        prev: null,
      };
    }
    if (typeof to === 'string') {
      let u;
      if (to.startsWith('http://') || to.startsWith('https://')) {
        u = new URL(to);
      } else if (to.startsWith('/')) {
        u = new URL(`http://localhost${to}`);
      } else {
        let { pathname } = location;
        if (!pathname.endsWith('/')) {
          pathname = pathname.replace(/\/[^/]*$/, '/');
        }
        u = new URL(`http://localhost${path}${to}`);
      }
      const href = `${u.pathname}${u.search}${u.hash}`;
      const newState = {
        title,
        path: u.pathname,
        search: u.search,
        hash: u.hash,
        prev: state,
      };
      console.debug('Link %o / %o', href, newState);
      if (replace) {
        newState.prev = state.prev;
        history.replace(href, newState);
      } else {
        history.push(href, newState);
      }
      return;
    }
    let href = '';
    const newState = {
      ...to,
      title,
      prev: state,
    };
    if (to.pathname) {
      if (to.pathname.startsWith('http://') || to.pathname.startsWith('https://')) {
        href = to.pathname;
      } else if (to.pathname.startsWith('/')) {
        href = to.pathname;
      } else {
        let { pathname } = location;
        if (!pathname.endsWith('/')) {
          pathname = pathname.replace(/\/[^/]*$/, '/');
        }
        href = `${pathname}${to.pathname}`;
      }
    } else {
      href = location.pathname;
    }
    if (to.search) {
      if (to.search.startsWith('?')) {
        href += to.search;
      } else {
        href += `?${to.search}`;
      }
    }
    if (to.hash) {
      if (to.hash.startsWith('#')) {
        href += to.hash;
      } else {
        href += `#${to.hash}`;
      }
    }
    console.debug('Link %o / %o', href, newState);
    if (replace) {
      newState.prev = state.prev;
      history.replace(href, newState)
    } else {
      history.push(href, newState);
    }
  }, [title, to, back, replace, history, onClick]);
  if (!to) {
    return children;
  }
  if (component) {
    const Comp = component;
    return (
      <Comp navigate={myOnClick} {...props}>{children}</Comp>
    );
  }
  return (
    <a href="#" onClick={myOnClick} {...props}>{children}</a>
  );
};

export default Link;
