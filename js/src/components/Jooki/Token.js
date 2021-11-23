import React, { useState, useEffect, useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";

import { useJooki } from '../../lib/jooki';
import { PlaylistMenu } from './PlaylistMenu';

export const jookiTokenImgUrl = (starId) => {
  const src = starId.toLowerCase().replace(/\./g, '-');
  return `/assets/icons/${src}.png`;
};

export const JookiToken = ({ starId, size, className }) => {
  return (
    <div className={`jookiToken ${className || ''}`}>
      <style jsx>{`
        .jookiToken {
          background-image: url(${jookiTokenImgUrl(starId)});
          background-size: cover;
          width: ${size}px;
          height: ${size}px;
        }
      `}</style>
    </div>
  );
};

export const TokenList = () => {
  const { playlists } = useJooki();
  /*
  const [playlists, setPlaylists] = useState([]);
  useEffect(() => {
    fetch('/api/jooki/playlists', { method: 'GET' })
      .then(resp => resp.json())
      .then(pls => {
        pls.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        setPlaylists(pls);
      });
  }, []);
  */
  const onSetToken = (tokenId, playlistId) => {
    const obj = { playlist_id: playlistId, token: tokenId }
    fetch('/api/jooki/playlist/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obj),
    })
      .then(() => fetch('/api/jooki/playlists', { method: 'GET' }))
      .then(resp => resp.json())
      .then(pls => {
        pls.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        setPlaylists(pls);
      });
  };
  const tokens = useMemo(() => {
    return playlists.filter(pl => !!pl.token)
      .map(pl => ({
        id: pl.persistent_id,
        name: pl.name,
        token: pl.token,
      }))
      .sort((a, b) => a.token < b.token ? -1 : a.token > b.token ? 1 : 0)
  }, [playlists]);
  return (
    <div className="tokens">
      { tokens.map(pl => (
        <div key={pl.token} className="token">
          <JookiToken size={50} starId={pl.token} />
          <PlaylistMenu
            playlists={playlists}
            selected={pl.id}
            onChange={id => onSetToken(pl.token, id)}
          />
        </div>
      )) }
      <style jsx>{`
        .token {
          display: flex;
          flex-direction: row;
        }
      `}</style>
    </div>
  );
};
