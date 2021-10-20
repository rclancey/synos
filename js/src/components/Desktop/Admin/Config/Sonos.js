import React, { useCallback } from 'react';

import Network from './Network';

export const Sonos = ({ cfg, onChange }) => {
  return (
    <Network header="Sonos Config" cfg={cfg} onChange={onChange} />
  );
};

export default Sonos;
