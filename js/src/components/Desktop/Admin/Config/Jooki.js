import React, { useCallback } from 'react';

import { TextInput } from './Input';

export const Jooki = ({ cfg, onChange }) => (
  <>
    <div className="header">Jooki Config</div>
    <div className="key inline">Cron:</div>
    <div className="value inline">
      <TextInput name="cron" cfg={cfg} onChange={onChange} />
    </div>
  </>
);

export default Jooki;
