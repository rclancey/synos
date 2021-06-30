import React, { useRef, useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../lib/theme';
import MusicIcon from '../assets/icons/music.png';

const icons = {
  downloaded_music: 'downloaded',
  downloaded_tvshows: 'downloaded',
  downloaded_movies: 'downloaded',
  playlists: 'playlist',
  standard: 'playlist',
  purchased_music: 'purchased',
};

const loaded = {};

export const Icon = ({ name, src, size = 16, style, ...props }) => {
  const theme = useContext(ThemeContext);
  let modSrc = src;
  if (!src) {
    modSrc = `${icons[name] || name}${theme === 'dark' ? '-dark' : ''}`;
  }
  const [icon, setIcon] = useState(src || loaded[modSrc] || MusicIcon);
  const mounted = useRef(true);
  useEffect(() => {
    if (src) {
      setIcon(src);
    } else {
      if (loaded[modSrc]) {
        setIcon(loaded[modSrc]);
      } else {
        import(`../assets/icons/${modSrc}.png`)
          .then(mod => {
            loaded[modSrc] = mod.default;
            if (mounted.current) {
              setIcon(mod.default);
            }
          })
          .catch(err => {
            console.error("error loading %o: %o", modSrc, err);
            if (mounted.current) {
              setIcon(MusicIcon);
            }
          });
      }
    }
    return () => {
      mounted.current = false;
    };
  }, [name, src, modSrc, theme]);
  return (
    <div className="icon" style={style} {...props}>
      <style jsx>{`
        .icon {
          background-image: url(${icon});
          min-width: ${size}px;
          max-width: ${size}px;
          width: ${size}px;
          min-height: ${size}px;
          max-height: ${size}px;
          height: ${size}px;
          background-size: cover;
        }
      `}</style>
    </div>
  );
};
