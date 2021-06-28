import React from 'react';

export const CoverArt = React.memo(({ track, size, radius, style, url, children }) => {
  const xstyle = Object.assign({
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxSizing: 'border-box',
  }, style);
  if (typeof size === 'number') {
    xstyle.width = `${size}px`;
    xstyle.minWidth = `${size}px`;
    xstyle.maxWidth = `${size}px`;
    xstyle.height = `${size}px`;
    xstyle.minHeight = `${size}px`;
    xstyle.maxHeight = `${size}px`;
  } else if (typeof size === 'string') {
    xstyle.width = size;
    xstyle.minWidth = size;
    xstyle.maxWidth = size;
    xstyle.height = size;
    xstyle.minHeight = size;
    xstyle.maxHeight = size;
  }
  if (radius) {
    xstyle.border = 'solid transparent 1px';
    xstyle.borderRadius = `${radius}px`;
  }
  if (url) {
    xstyle.backgroundImage = `url(${url})`;
  } else if (track) {
    if (track.artwork_url) {
      xstyle.backgroundImage = `url(${track.artwork_url})`;
    } else if (track.persistent_id) {
      xstyle.backgroundImage = `url(/api/art/track/${track.persistent_id})`;
    } else if (track.album) {
      if (track.album_artist) {
        xstyle.backgroundImage = `url(/api/art/album?artist=${escape(track.album_artist)}&album=${escape(track.album)})`;
      } else if (track.artist) {
        xstyle.backgroundImage = `url(/api/art/album?artist=${escape(track.artist)}&album=${escape(track.album)})`;
      }
    } else if (track.artist) {
      xstyle.backgroundImage = `url(/api/art/artist?artist=${escape(track.artist)})`;
    }
  }
  return (
    <div className="coverart" style={xstyle}>{children}</div>
  );
});
