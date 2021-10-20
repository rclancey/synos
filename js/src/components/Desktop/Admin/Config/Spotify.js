import React from 'react';

import { TextInput, FilenameInput, DurationInput } from './Input';

/*
    ClientID       string `json:"client_id"`//     arg:"--spotify-client-id"`
    ClientSecret   string `json:"client_secret"`// arg:"--spotify-client-secret"`
    CacheDirectory string `json:"cache"`//         arg:"--spotify-cache"`
    CacheTime      int    `json:"cache_time"`//    arg:"--spotify-cache-time"`
*/

export const Spotify = ({ cfg, onChange }) => (
  <>
    <div className="header">Spotify API Access</div>
    <div className="key">Client ID:</div>
    <div className="value">
      <TextInput name="client_id" size={40} cfg={cfg} onChange={onChange} />
    </div>
    <div className="key">Client Secret:</div>
    <div className="value">
      <TextInput name="client_secret" size={40} cfg={cfg} onChange={onChange} />
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

export default Spotify;
