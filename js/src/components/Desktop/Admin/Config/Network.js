import React, { useCallback } from 'react';

import { TextInput } from './Input';
/*
    Network      string `json:"network"   arg:"network"`
    Interface    string `json:"interface" arg:"interface"`
    IP           string `json:"ip"        arg:"ip"`
*/

export const Network = ({ header, name, cfg, onChange }) => (
  <>
    <div className="header">{header}</div>
    <div className="key inline">Network:</div>
    <div className="value inline">
      <TextInput name="network" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Interface:</div>
    <div className="value inline">
      <TextInput name="interface" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">IP Address:</div>
    <div className="value inline">
      <TextInput name="ip" cfg={cfg} onChange={onChange} />
    </div>
  </>
);

export default Network;
