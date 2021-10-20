import React, { useCallback } from 'react';

import { TextInput, IntegerInput, FilenameInput, BoolInput } from './Input';
/*
    Username *string `json:"username" arg:"username"`
    Password *string `json:"password" arg:"password"`
    Host     string  `json:"host"     arg:"host"`
    Port     int     `json:"port"     arg:"port"`
*/

export const SMTP = ({ cfg, onChange }) => (
  <>
    <div className="header">SMTP</div>
    <div className="key inline">Username:</div>
    <div className="value inline">
      <TextInput name="username" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Password:</div>
    <div className="value inline">
      <TextInput name="password" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Host:</div>
    <div className="value inline">
      <TextInput name="host" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Port:</div>
    <div className="value inline">
      <IntegerInput name="port" cfg={cfg} onChange={onChange} />
    </div>
  </>
);

export default SMTP;
