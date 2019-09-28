import React, { useContext } from 'react';

export const ThemeContext = React.createContext('dark');

export const colors = {
  dark: {
    background: '#000',
    sectionBackground: '#222',
    text: '#999',
    text1: '#999',
    text2: '#777',
    blurHighlight: '#545456',
    highlightText: '#09c',
    highlightInverse: '#fff',
    button: '#09c',
    switch: {
      border: {
        on: '#09c',
        off: 'rgba(204, 204, 204, 0.7)',
      },
      knob: {
        background: '#444',
        shadow: 'rgba(200, 200, 200, 0.7)',
      },
    },
    disabler: 'rgba(0, 153, 204, 0.3)',
    panelBackground: '#32363b',
    panelText: '#fff',
    dropTarget: {
      folderBackground: 'yellow',
      folderText: 'black',
      playlistBackground: 'orange',
      playlistText: 'black',
    },
    trackList: {
      background: '#1e2023',
      border: '#353739',
      evenBg: '#292b2e',
      text: 'white',
      separator: '#494b4d',
    },
    /*
    body: '#1e2023',
    even: '#292b2e',
    odd: '#1e2023',
    border: '#494b4d',
    highlight: '#2687fb',
    blurHighlight: '#545456',
    */
  },
  light: {
  },
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  return colors[theme];
};

