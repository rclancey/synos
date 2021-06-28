import React, { useContext } from 'react';

export const ThemeContext = React.createContext('dark');

export const colors = {
  dark: {
    background: '#000',
    sectionBackground: '#222',
    text: '#999',
    text1: '#999',
    text2: '#777',
    text3: '#333',
    blurHighlight: '#545456',
    highlightText: '#09c',
    highlightInverse: '#fff',
    input: '#fff',
    inputBackground: '#222',
    inputGradient: '#555',
    infoBackground: '#555',
    tabBackground: '#888',
    tabColor: '#fff',
    disabledBackground: '#444',
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
    panelBorder: '#444',
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
    login: {
      border: '#fff',
      text: '#2687fb',
      shadow: '#2687fb',
      background: '#1e2023',
      gradient1: '#144987',
      gradient2: '#1e2023',
    },
  },

  light: {
    background: '#fff',
    sectionBackground: '#ddd',
    text: '#000',
    text1: '#000',
    text2: '#666',
    text3: '#ddd',
    blurHighlight: '#999',
    highlightText: '#09c',
    highlightInverse: '#fff',
    input: '#000',
    inputBackground: '#fff',
    inputGradient: '#999',
    infoBackground: '#ddd',
    tabBackground: '#999',
    tabColor: '#000',
    button: '$09c',
    switch: {
      border: {
        on: '#09c',
        off: 'rgba(204, 204, 204, 0.7)',
      },
      knob: {
        background: '#fff',
        shadow: 'rgba(200, 200, 200, 0.7)',
      },
    },
    disabler: 'rgba(0, 153, 204, 0.3)',
    panelBackground: '#ccc',
    panelText: '#000',
    panelBorder: '#aaa',
    dropTarget: {
      folderBackground: 'yellow',
      folderText: 'black',
      playlistBackground: 'orange',
      playlistText: 'black',
    },
    trackList: {
      background: '#fff',
      border: '#999',
      evenBg: '#eee',
      text: '#000',
      separator: '#777',
    },
    login: {
      border: '#000',
      text: '#000',
      shadow: '#000',
      background: '#ccc',
      gradient1: '#144987',
      gradient2: '#1e2023',
    },
  },
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  return colors[theme];
};

