import React, { useCallback } from 'react';

import { TextInput, IntegerInput, FilenameInput, DurationInput, BoolInput } from './Input';
/*
    Name     string `json:"name"`//     arg:"--db-name"`
    Host     string `json:"host"`//     arg:"--db-host"`
    Port     int    `json:"port"`//     arg:"--db-port"`
    Socket   string `json:"socket"`//   arg:"--db-socket"`
    Username string `json:"username"`// arg:"--db-username"`
    Password string `json:"password"`// arg:"--db-password"`
    Timeout  int    `json:"timeout"`//  arg:"--db-timeout"`
    SSL      bool   `json:"ssl"`//      arg:"--db-ssl"`
*/

export const Database = ({ cfg, onChange }) => (
  <>
    <div className="header">Database Connection</div>
    <div className="key inline">Name:</div>
    <div className="value inline">
      <TextInput name="name" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Host:</div>
    <div className="value inline">
      <TextInput name="host" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Port:</div>
    <div className="value inline">
      <IntegerInput name="port" min={1024} max={32767} cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Socket:</div>
    <div className="value inline">
      <FilenameInput name="socket" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Username:</div>
    <div className="value inline">
      <TextInput name="username" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Password:</div>
    <div className="value inline">
      <TextInput name="password" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Timeout:</div>
    <div className="value inline">
      <DurationInput name="timeout" cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Use SSL:</div>
    <div className="value inline">
      <BoolInput name="ssl" cfg={cfg} onChange={onChange} />
    </div>
  </>
);

export default Database;
