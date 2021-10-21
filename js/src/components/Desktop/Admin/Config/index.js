import React, { useState, useCallback, useEffect, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { Dialog } from '../../Dialog';
import { TextInput } from '../../../Input/TextInput';
import { IntegerInput } from '../../../Input/IntegerInput';
import { MenuInput } from '../../../Input/MenuInput';
import { BoolInput } from '../../../Input/BoolInput';
import { Button } from '../../../Input/Button';
import { SubObject } from './Input';
import Cause from './Cause';
import Server from './Server';
import Bind from './Bind';
import Logging from './Logging';
import Auth from './Auth';
import Database from './Database';
import SMTP from './SMTP';
import ITunes from './iTunes';
import Finder from './Finder';
import Airplay from './Airplay';
import Jooki from './Jooki';
import Sonos from './Sonos';
import Spotify from './Spotify';
import LastFM from './LastFM';

export const Config = ({ cause, onClose }) => {
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    document.body.className = 'dark fuchsia';
    fetch('/api/setup/config', { method: 'GET' })
      .then((resp) => resp.json())
      .then(setCfg);
  }, []);
  const onChange = useCallback((update) => setCfg((orig) => {
    return {
      ...orig,
      raw_config: {
        ...orig.raw_config,
        ...update,
      },
    };
  }), []);
  if (cfg === null) {
    return null;
  }
  return (
    <div className="config">
      <style jsx>{`
        /*
        .config {
          display: grid;
          grid-template-columns: min-content auto;
          font-size: 12px;
          width: min-content;
          margin-left: auto;
          margin-right: auto;
        }
        .config > :global(div) {
          margin-bottom: 4px;
          align-items: baseline;
        }
        .config :global(.buttons) {
          grid-column: 1 / span 2;
          text-align: center;
          border-top: solid var(--border) 1px;
          margin-top: 18px;
          margin-bottom: 6px;
          padding-top: 12px;
        }
        .config :global(.header) {
          grid-column: 1 / span 2;
          font-weight: 600;
          font-size: 125%;
          border-bottom: solid var(--border) 1px;
          margin-top: 12px;
          margin-bottom: 6px;
          padding-bottom: 2px;
        }
        .config :global(.key) {
          font-weight: 600;
          text-align: right;
          padding-right: 1em;
          white-space: nowrap;
        }
        .config :global(input[type="number"]) {
          width: 50px;
        }
        */
      `}</style>
      <Cause cause={cause} />
      <Server cfg={cfg} onChange={onChange} />
      <SubObject name="bind" Comp={Bind} cfg={cfg} onChange={onChange} />
      <SubObject name="log" Comp={Logging} cfg={cfg} onChange={onChange} />
      <SubObject name="auth" Comp={Auth} cfg={cfg} onChange={onChange} />
      <SubObject name="database" Comp={Database} cfg={cfg} onChange={onChange} />
      <SubObject name="smtp" Comp={SMTP} cfg={cfg} onChange={onChange} />
      <SubObject name="itunes" Comp={ITunes} cfg={cfg} onChange={onChange} />
      <SubObject name="finder" Comp={Finder} cfg={cfg} onChange={onChange} />
      <SubObject name="sonos" Comp={Sonos} cfg={cfg} onChange={onChange} />
      <SubObject name="jooki" Comp={Jooki} cfg={cfg} onChange={onChange} />
      <SubObject name="airplay" Comp={Airplay} cfg={cfg} onChange={onChange} />
      <SubObject name="spotify" Comp={Spotify} cfg={cfg} onChange={onChange} />
      <SubObject name="lastfm" Comp={LastFM} cfg={cfg} onChange={onChange} />
      <div className="buttons">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default Config;
