import React, { useState, useCallback, useEffect, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { API } from '../../lib/api';
import { TwoFactorCode } from '../Password';
import Button from '../Input/Button';

const RecoveryKeys = ({ keys, copied, setCopied }) => {
  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(keys.map((k) => `${k}
`).join(''))
      .then(() => setCopied(true));
  }, [keys]);
  return (
    <>
      <div className="recoveryKeys" onClick={onCopy}>
        <style jsx>{`
          .recoveryKeys {
            display: flex;
            flex-wrap: wrap;
            font-family: monospace;
            font-size: var(--font-size-normal);
          }
          .recoveryKeys>div {
            white-space: nowrap;
            flex: 1;
            margin-left: 0.5em;
            margin-right: 0.5em;
            text-align: center;
          }
        `}</style>
        { keys.map((rkey) => (<div key={rkey}>{rkey}</div>)) }
      </div>
      {copied ? <p>Copied to clipboard!</p> : null}
    </>
  );
};

export const TwoFactor = ({ onClose }) => {
  const [init, setInit] = useState(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const onConfirm = useCallback(() => {
    const api = new API();
    api.put('/api/twofactor', { two_factor_code: code })
      .then(() => onClose())
      .catch((err) => setError(`${err}`));
  }, [code]);
  useEffect(() => {
    const api = new API();
    api.post('/api/twofactor')
      .then((cfg) => {
        const u = new URL(cfg.uri);
        const parts = u.pathname.split('/');
        const account = parts.pop().split(':');
        const username = account.pop();
        const hostname = account.join(':');
        const timed = parts.pop() === 'totp';
        const secret = u.searchParams.get('secret');
        setInit({
          ...cfg,
          hostname,
          username,
          timed,
          secret,
        });
      })
      .catch((err) => setError(`${err}`));
  }, []);
  console.debug('init = %o', init);
  if (init === null) {
    return null;
  }
  return (
      <div className="initTwoFactor">
        <style jsx>{`
          .initTwoFactor img {
            display: block;
            margin-left: auto;
            margin-right: auto;
            width: 200px;
            height: 200px;
          }
          .initTwoFactor .config {
            display: grid;
            grid-template-columns: 100px auto;
            margin-left: 10px;
          }
          .initTwoFactor .code {
            text-align: center;
          }
        `}</style>
        <p>
          Open your authenticator app (for example, Google Authenticator),
          and add a new key by scanning this QR code.
        </p>
        <img src={init.qr_code} />
        {/*
        <p>
          Alternatively, you may manually add your key with the following
          parameters:
        </p>
        <div className="config">
          <div>Account:</div>
          <div>{init.username}@{init.hostname}</div>
          <div>Key:</div>
          <div>{init.secret}</div>
          <div>Time Based:</div>
          <div>{init.timed ? 'Yes' : 'No'}</div>
        </div>
        */}
        <p>
          Below are recovery keys you can use in case your phone is lost or
          replaced. Save these somewhere safe!
        </p>
        <RecoveryKeys keys={init.recovery_keys} copied={copied} setCopied={setCopied} />
        { error !== null ? (
          <div className="error">{error}</div>
        ) : null }
        <p>
          After you've set up your account in you authenticator app, enter
          the code below to complete the two factor authentication setup.
        </p>
        <div className="code">
          <p>
            <TwoFactorCode value={code} onChange={setCode} />
            {/*
            <input
              className="twoFactorCode"
              type="text"
              name="new-2facode"
              autofill="new-password"
              size={6}
              maxlength={6}
              value={code}
              onInput={onInput}
            />
            */}
          </p>
          <Button disabled={code.length != 6} onClick={onConfirm}>Confirm</Button>
          <Button type="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
  );
};

export default TwoFactor;

