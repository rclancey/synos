import React from 'react';
import { CoverArt } from '../../../CoverArt';

export const JookiCoverArt = ({ track, ...props }) => {
  if (track === null || track === undefined) {
    return null;
  }
  const extra = {}
  if (track.jooki_id && track.hasImage) {
    extra.url = `/api/jooki/art/${track.jooki_id}`;
  }
  return (
    <CoverArt track={track} {...extra} {...props} />
  );
};

