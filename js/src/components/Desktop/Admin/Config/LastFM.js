import React from 'react';

import { TextInput, FilenameInput, DurationInput } from './Input';

/*
    APIKey         string `json:"api_key"`//    arg:"--lastfm-api-key"`
    CacheDirectory string `json:"cache"`//      arg:"--lastfm-cache"`
    CacheTime      int    `json:"cache_time"`// arg:"--lastfm-cache-time"`
*/

export const LastFM = ({ cfg, onChange }) => (
  <>
    <div className="header">LastFM API Access</div>
    <div className="key">API Key:</div>
    <div className="value">
      <TextInput name="api_key" size={40} cfg={cfg} onChange={onChange} />
    </div>
    <div className="key">Cache Directory:</div>
    <div className="value">
      <FilenameInput name="cache" size={40} cfg={cfg} onChange={onChange} />
    </div>
    <div className="key inline">Cache Time:</div>
    <div className="value inline">
      <DurationInput name="cache_time" cfg={cfg} onChange={onChange} />
    </div>
  </>
);

export default LastFM;
