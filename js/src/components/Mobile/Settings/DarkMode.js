import React, { useContext } from 'react';

import { ThemeContext } from '../../../lib/theme';

export const DarkMode = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  return (
    <>
      <div>Dark Mode:</div>
      <div>
        <input type="radio" name="darkmode" value="on" checked={darkMode === true} onClick={() => setDarkMode(true)} />
        {'On\u00a0\u00a0\u00a0'}
        <input type="radio" name="darkmode" value="off" checked={darkMode === false} onClick={() => setDarkMode(false)} />
        {'Off\u00a0\u00a0\u00a0'}
        <input type="radio" name="darkmode" value="default" checked={darkMode === null} onClick={() => setDarkMode(null)} />
        {'Default'}
      </div>
    </>
  );
};

export default DarkMode;
