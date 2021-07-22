import React, { useContext, useCallback } from 'react';

import { ThemeContext } from '../../../lib/theme';

const themes = [
  'grey',
  'red',
  'orange',
  'yellow',
  'green',
  'seafoam',
  'teal',
  'slate',
  'blue',
  'indigo',
  'purple',
  'fuchsia',
];

export const ThemeChooser = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const onChange = useCallback((evt) => setTheme(evt.target.value), [setTheme]);
  return (
    <>
      <div>Theme:</div>
      <div>
        <select value={theme} onChange={onChange}>
          {themes.map((t) => (<option key={t} value={t}>{`${t.substr(0, 1).toUpperCase()}${t.substr(1)}`}</option>))}
        </select>
      </div>
    </>
  );
};

export default ThemeChooser;
