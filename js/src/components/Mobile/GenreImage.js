import React from 'react';
import { CoverArt } from '../CoverArt';

export const GenreImage = ({ genre, size }) => (
  <CoverArt
    url={`/api/art/genre?genre=${escape(genre.sort)}`}
    size={size}
    radius={5}
  />
);
