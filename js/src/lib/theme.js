import React, { useContext } from 'react';

import Dimension from './dimension';
import Color from './color';

export const ThemeContext = React.createContext({ theme: 'grey', dark: false });

const state = { current: null };

const cssVars = [
  '--gradient-end',
  '--lightness',
  '--lightness-contrast',
  '--inverse',
  '--highlight-dull',
  '--hue',
  '--sat',
  '--gradient-stretch',
  '--gradient-compress',
  //'--highlight-lightness',

  '--highlight-blur',
  '--blur-background',
  '--text',
  '--contrast1',
  '--contrast2',
  '--contrast3',
  '--contrast4',
  '--contrast5',
  '--border',

  '--gradient-start',
  '--text',
  '--highlight',
  '--highlight-muted',
];

const getProperty = (style, prop) => {
  let value = style.getPropertyValue(prop).trim();
  const dim = new Dimension(value);
  if (dim.type === null) {
    return new Color(value);
  }
  return dim;
};

export const setTheme = (theme, dark, time) => {
  if (time <= 0) {
    state.current = Math.random();
    document.body.className = `${theme} ${dark ? 'dark' : 'light'}`;
    return Promise.resolve({ theme, dark });
  }
  return new Promise((resolve, reject) => {
    let style = getComputedStyle(document.body);
    const startValues = {};
    const targetValues = {};
    cssVars.forEach((prop) => {
      startValues[prop] = getProperty(style, prop);
    });
    cssVars.forEach((prop) => {
      document.body.style.removeProperty(prop);
    });
    document.body.className = `${theme} ${dark ? 'dark' : 'light'}`;
    style = getComputedStyle(document.body);
    cssVars.forEach((prop) => {
      targetValues[prop] = getProperty(style, prop);
    });
    cssVars.forEach((prop) => {
      document.body.style.setProperty(prop, startValues[prop].css());
    });
    document.body.className = '';
    startValues['--hue'].value = (startValues['--hue'].value + 720) % 360;
    targetValues['--hue'].value = (targetValues['--hue'].value + 720) % 360;
    if (targetValues['--hue'].value - startValues['--hue'].value > 180) {
      targetValues['--hue'].value -= 360;
    } else if (startValues['--hue'].value - targetValues['--hue'].value > 180) {
      targetValues['--hue'].value += 360;
    }
    const startTime = Date.now();
    const trid = Math.random();
    state.current = trid;
    //console.debug('transition %o => %o', startValues, targetValues)
    const callback = () => {
      window.debugColor = Color;
      if (trid !== state.current) {
        reject({ theme, dark, time, aborted: true });
        return;
      }
      const now = Date.now();
      const pct = (now - startTime) / time;
      if (pct >= 1) {
        document.body.className = `${theme} ${dark ? 'dark' : 'light'}`;
        cssVars.forEach((prop) => document.body.style.removeProperty(prop));
        resolve({ theme, dark });
      } else {
        cssVars.forEach((prop) => {
          try {
            const val = startValues[prop].interpolate(targetValues[prop], pct);
            document.body.style.setProperty(prop, val.css());
          } catch (err) {
            console.error("%o interpolate %o => %o (%o) error: %o", prop, startValues[prop], targetValues[prop], pct, err);
          }
        });
        if (pct > 0.8) {
          //return;
        }
        window.requestAnimationFrame(callback);
      }
    };
    window.requestAnimationFrame(callback);

  });
};
