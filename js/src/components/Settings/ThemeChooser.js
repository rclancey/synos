import React, { useContext, useCallback } from 'react';

import { ThemeContext } from '../../lib/theme';
import Grid from '../Grid';

export const DarkMode = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  return (
    <div className="darkMode">
      <input type="radio" name="darkmode" value="on" checked={darkMode === true} onClick={() => setDarkMode(true)} />
      {'On\u00a0\u00a0\u00a0'}
      <input type="radio" name="darkmode" value="off" checked={darkMode === false} onClick={() => setDarkMode(false)} />
      {'Off\u00a0\u00a0\u00a0'}
      <input type="radio" name="darkmode" value="default" checked={darkMode === null} onClick={() => setDarkMode(null)} />
      {'Default'}
    </div>
  );
};

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

export const ColorChooser = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const onChange = useCallback((evt) => setTheme(evt.target.value), [setTheme]);
  return (
    <div className="colorChooser">
      <select value={theme} onChange={onChange}>
        {themes.map((t) => (<option key={t} value={t}>{`${t.substr(0, 1).toUpperCase()}${t.substr(1)}`}</option>))}
      </select>
    </div>
  );
};

export const ThemeChooser = () => (
  <Grid>
    <div>Dark Mode:</div>
    <DarkMode />
    <div>Theme:</div>
    <ColorChooser />
  </Grid>
);

export default ThemeChooser;
