import React from 'react';
import { CoverArt } from '../CoverArt';

export const ArtistImage = ({ artist, size }) => (
  <CoverArt
    url={`/api/art/artist?artist=${escape(artist.sort)}`}
    size={size}
    radius={size}
  />
);
