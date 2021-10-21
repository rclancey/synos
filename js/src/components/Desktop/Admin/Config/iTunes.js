import React, { useCallback } from 'react';

import { Button } from '../../../Input/Button';
import { ReplaceHome, MultiStringInput } from './Input';
/*
    Library []string `json:"library"`// arg:"--itunes-library"`
*/

export const ITunes = ({ cfg, onChange }) => {
  const { home_directory, working_directory } = cfg;
  const replacer = useCallback((v) => ReplaceHome(v, home_directory, working_directory), [home_directory, working_directory]);
  return (
    <>
      <div className="header">iTunes</div>
      <div className="key">Libraries:</div>
      <div className="value">
        <MultiStringInput name="library" replacer={replacer} cfg={cfg} onChange={onChange} cols={60} rows={8} />
      </div>
    </>
  );
};

export default ITunes;
