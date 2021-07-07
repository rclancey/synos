import React from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useTheme } from '../../../../lib/theme';
import { CoverArt } from '../../../CoverArt';

export const Header = ({
  track,
}) => {
  const colors = useTheme();
  return (
    <div className="header">
      <CoverArt track={track} size={100} radius={5} />
      <div className="info">
        <div className="name">{track.name || track.album_artist || track.artist}</div>
        { track.name ? (
          <div className="artist">{track.artist}</div>
        ) : null }
        <div className="album">{track.album}</div>
      </div>
      <style jsx>{`
        .header {
          display: flex;
        }
        .header :global(.coverart) {
          flex: 1;
        }
        .header .info {
          flex: 10;
          margin-left: 1em;
          margin-top: 10px;
          overflow: hidden;
        }
        .header .info div {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .header .info .name {
          font-size: 24px;
          color: ${colors.panelText};
        }
        .header .info .artist, .header .info .album {
          font-size: 12px;
          color: #${colors.text};
        }
      `}</style>
    </div>
  );
};

