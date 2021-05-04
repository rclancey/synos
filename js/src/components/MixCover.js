import React, { useMemo } from 'react';
import { CoverArt } from './CoverArt';

export const MixCover = ({ tracks, size = 140, radius = 5 }) => {
  const isAlbum = useMemo(() => {
    if (!tracks || tracks.length === 0) {
      return true;
    }
    return tracks.every(track => track.album === tracks[0].album);
  }, [tracks]);
  if (isAlbum && tracks) {
    return <CoverArt track={tracks[0]} size={size} />;
  }
  const seen = new Set();
  const covers = tracks ? tracks.filter(tr => {
    const k = (tr.album_artist || tr.artist) + '||' + tr.album;
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  }) : [];
  return (
    <div className="cover">
      <div className="row">
        <CoverArt track={covers[0]} size={size / 2} />
        <CoverArt track={covers[1]} size={size / 2} />
      </div>
      <div className="row">
        <CoverArt track={covers[2]} size={size / 2} />
        <CoverArt track={covers[3]} size={size / 2} />
      </div>
      <style jsx>{`
        .cover {
          flex: 1;
          width: ${size}px;
          min-width: ${size}px;
          max-width: ${size}px;
          height: ${size}px;
          background-size: cover;
          border: 1px solid transparent;
          border-radius: ${radius}px;
          overflow: hidden;
        }
        .row {
          display: flex;
          flex-direction: row;
        }
      `}</style>
    </div>
  );
};

