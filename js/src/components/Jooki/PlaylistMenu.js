import React from 'react';
import { useTheme } from '../../lib/theme';

export const PlaylistMenu = ({ playlists, selected, onChange }) => {
  const colors = useTheme();
  return (
    <select
      value={selected}
      onChange={evt => onChange(evt.target.options[evt.target.selectedIndex].value)}
    >
      {playlists.map(pl => (
        <option key={pl.persistent_id} value={pl.persistent_id}>{pl.name}</option>
      ))}
      <style jsx>{`
        select {
          margin: .5em;
          background-color: ${colors.background};
          border-color: ${colors.highlightText};
          color: ${colors.highlightText};
          font-size: 100%;
        }
      `}</style>
    </select>
  );
};
