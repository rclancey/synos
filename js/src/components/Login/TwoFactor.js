import React, { useCallback, useState, useMemo } from 'react';

import { TwoFactorCode } from '../Password';
import Button from '../Input/Button';

export const TwoFactor = ({ token }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const onAuth = useCallback(() => {
    token.twoFactor(code)
      .catch((err) => setError(`${err}`));
  }, [token, code]);
  return (
    <>
      <div colspan={2}>
        <p>Enter the 6-digit code from your authenticator app</p>
      </div>
      <div>Code:</div>
      <div>
        <TwoFactorCode value={code} onChange={setCode} />
      </div>
      <div />
      <div>
        <Button disabled={code.length != 6} onClick={onAuth}>Login</Button>
      </div>
    </>
  );
};

export default TwoFactor;
