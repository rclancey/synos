import React from 'react';
import _JSXStyle from "styled-jsx/style";

export const PlaylistMenu = ({ playlists, selected, onChange }) => {
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
          font-size: 100%;
        }
      `}</style>
    </select>
  );
};
