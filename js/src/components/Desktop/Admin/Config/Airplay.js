import React, { useCallback } from 'react';

import Network from './Network';

export const Airplay = ({ cfg, onChange }) => {
  return (
    <Network header="Airplay Config" cfg={cfg} onChange={onChange} />
  );
};

export default Airplay;
