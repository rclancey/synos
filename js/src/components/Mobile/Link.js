import React, { useMemo, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useHistoryState } from '../../lib/history';

export const Link = ({ title, to, ...props }) => {
  const state = useHistoryState();
  const myTo = useMemo(() => {
    if (typeof to === 'string') {
      let u;
      if (to.startsWith('http://') || to.startsWith('https://')) {
        u = new URL(to);
      } else if (to.startsWith('/')) {
        u = new URL(`http://localhost${to}`);
      } else {
        let path = state.path;
        if (!path.endsWith('/')) {
          path = path.replace(/\/[^/]*$/, '/');
        }
        u = new URL(`http://localhost${path}${to}`);
      }
      return {
        pathname: to,
        state: {
          title,
          path: u.pathname,
          search: u.search,
          hash: u.hash,
          prev: state,
        },
      };
    }
    if (to.state) {
      return {
        ...to,
        state: {
          ...to.state,
          title,
          path: to.path,
          search: to.search,
          hash: to.hash,
          prev: state,
        },
      };
    }
    return {
      ...to, 
      state: {
        title,
        path: to.path,
        search: to.search,
        hash: to.hash,
        prev: state,
      },
    };
  }, [title, to, state]);
  return (
    <RouterLink to={myTo} {...props} />
  );
};

export default Link;
