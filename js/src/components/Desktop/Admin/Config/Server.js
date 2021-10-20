import React from 'react';

import { TextInput, FilenameInput, URLInput } from './Input';

/*
    ServerRoot          string         `json:"server_root"     arg:"--server-root"`
    DocumentRoot        string         `json:"document_root"   arg:"--docroot"`
    DefaultProxy        string         `json:"default_proxy"   arg:"--proxy"`
    CacheDirectory      string         `json:"cache_directory" arg:"--cache-dir"`
    PidFile             string         `json:"pidfile"         arg:"--pidfile"`
    Bind                BindConfig     `json:"bind"            arg:"--bind"`
    Logging             LogConfig      `json:"log"             arg:"--log"`
*/

export const Server = ({ cfg, onChange }) => (
  <>
    <div className="header">Server</div>
    <div className="key">Server Root:</div>
    <div className="value">
      <TextInput
        name="server_root"
        size={60}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key">Document Root:</div>
    <div className="value">
      <TextInput
        name="document_root"
        size={60}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key">Default Proxy:</div>
    <div className="value">
      <URLInput
        name="default_proxy"
        size={60}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key">Cache Directory:</div>
    <div className="value">
      <TextInput
        name="cache_directory"
        size={60}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
    <div className="key">PID File:</div>
    <div className="value">
      <TextInput
        name="pidfile"
        size={60}
        cfg={cfg}
        onChange={onChange}
      />
    </div>
  </>
);

export default Server;
