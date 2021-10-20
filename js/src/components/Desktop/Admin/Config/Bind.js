import React, { useCallback } from 'react';

import { SubObject, TextInput, IntegerInput, FilenameInput, BoolInput } from './Input';
/*
    ExternalHostname string    `json:"hostname" arg:"hostname"`
    Port             int       `json:"port"     arg:"port"`
    SSL              SSLConfig `json:"ssl"      arg:"ssl"`
*/

/*
    Port     int    `json:"port"     arg:"port"`
    CertFile string `json:"cert"     arg:"cert"`
    KeyFile  string `json:"key"      arg:"key"`
    Disabled bool   `json:"disabled" arg:"disable"`
*/

export const SSL = ({ cfg, onChange }) => {
  const { raw_config } = (cfg || {});
  const { disabled } = (raw_config || {});
  return (
    <>
      <div className="header">SSL Config</div>
      <div className="key inline">Disabled:</div>
      <div className="value inline">
        <BoolInput
          name="disabled"
          cfg={cfg}
          onChange={onChange}
        />
      </div>
      <div className="key inline">HTTPS Port:</div>
      <div className="value inline">
        <IntegerInput
          name="port"
          cfg={cfg}
          min={1024}
          max={32767}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
      <div className="key inline">Certificate:</div>
      <div className="value inline">
        <FilenameInput
          name="cert"
          cfg={cfg}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
      <div className="key inline">Certificate Key:</div>
      <div className="value inline">
        <FilenameInput
          name="key"
          cfg={cfg}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </>
  );
};

export const Bind = ({ cfg, onChange }) => (
  <>
    <div className="header">Host Binding</div>
    <div className="key inline">External Hostname:</div>
    <div className="value inline">
      <TextInput
        name="hostname"
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key inline">HTTP Port:</div>
    <div className="value inline">
      <IntegerInput
        name="port"
        cfg={cfg}
        min={1024}
        max={32767}
        onChange={onChange}
      />
    </div>
    <SubObject name="ssl" Comp={SSL} cfg={cfg} onChange={onChange} />
  </>
);

export default Bind;
