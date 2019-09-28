import React from 'react';

export const PlaylistMenu = ({ playlists, selected, onChange }) => (
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
        background-color: #1e2023;
        border-color: #2687fb;
        color: #2687fb;
        font-size: 100%;
      }
    `}</style>
  </select>
);
