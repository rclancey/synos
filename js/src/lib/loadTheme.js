const loaded = {};

export const loadTheme = (theme) => {
  if (loaded[theme]) {
    return loaded[theme];
  }
  loaded[theme] = import(`../themes/${theme}.css`)
    .then(css => {
      loaded[theme] = css;
      return css;
    });
};
