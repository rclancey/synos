import React, { useCallback } from 'react';

import { FilenameInput, DurationInput, IntegerInput, SizeInput, MenuInput } from './Input';

/*
    Directory    string           `json:"directory"     arg:"dir"`
    AccessLog    string           `json:"access"        arg:"access"`
    ErrorLog     string           `json:"error"         arg:"error"`
    RotatePeriod int              `json:"rotate_period" arg:"rotate-period"`
    MaxSize      int64            `json:"max_size"      arg:"max-size"`
    RetainCount  int              `json:"retain"        arg:"retain"`
    LogLevel     logging.LogLevel `json:"level"         arg:"level"`
*/

const logLevelOptions = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'ERROR', label: 'Error' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'INFO', label: 'Info' },
  { value: 'DEBUG', label: 'Debug' },
];

const rotateUnitOptions = [
  { value: 1, label: 'Minutes' },
  { value: 60, label: 'Hours' },
  { value: 24 * 60, label: 'Days' },
  { value: 7 * 24 * 60, label: 'Weeks' },
  { value: 30 * 24 * 60, label: 'Months' },
  { value: 365 * 24 * 60, label: 'Years' },
];

export const Logging = ({ cfg, onChange }) => (
  <>
    <div className="header">Logging</div>
    <div className="key inline">Directory:</div>
    <div className="value inline">
      <FilenameInput
        name="directory"
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Access Log:</div>
    <div className="value inline">
      <FilenameInput
        name="access"
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Error Log:</div>
    <div className="value inline">
      <FilenameInput
        name="error"
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Rotation Period:</div>
    <div className="value inline">
      <DurationInput
        name="rotate_period"
        unitOptions={rotateUnitOptions}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Max Size:</div>
    <div className="value inline">
      <SizeInput
        name="max_size"
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Log Retention:</div>
    <div className="value inline">
      <IntegerInput
        name="retain"
        min={0}
        max={99}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">Log Level:</div>
    <div className="value inline">
      <MenuInput
        name="level"
        options={logLevelOptions}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
  </>
);

export default Logging;
