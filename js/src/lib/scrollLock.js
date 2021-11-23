const scrollPos = {};

const getPageKey = () => {
  if (typeof document === 'undefined') {
    return null;
  }
  return document.location.pathname + document.location.search;
};

export const preserveScroll = ({ scrollDirection, scrollOffset, scrollUpdateWasRequested}) => {
  const key = getPageKey();
  if (key === null) {
    return false;
  }
  scrollPos[key] = scrollOffset;
  /*
  const scrollNode = node.firstElementChild.firstElementChild;
  scrollPos[key] = {
    top: scrollNode.scrollTop,
    left: scrollNode.scrollLeft,
  };
  */
  return true;
};

export const scrollPreserver = (key) => {
  return ({ scrollOffset }) => {
    scrollPos[key] = scrollOffset;
    return true;
  };
};

export const fetchScroll = (key) => {
  const xkey = key === undefined ? getPageKey() : key;
  if (xkey === null) {
    return undefined;
    //return { top: 0, left: 0 };
  }
  //return scrollPos[xkey] || { top: 0, left: 0 };
  return scrollPos[xkey];
};

export const loadScroll = (node) => {
  const key = getPageKey();
  if (key === null) {
    return false;
  }
  const pos = scrollPos[key];
  if (!pos) {
    return false;
  }
  const scrollNode = node.firstElementChild.firstElementChild;
  scrollNode.scrollTo(pos.left, pos.top);
  return true;
};
