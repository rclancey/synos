import React, { useCallback, useState, useMemo } from 'react';

export const TwoFactor = ({ token }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const onAuth = useCallback(() => {
    token.twoFactor(code)
      .catch((err) => setError(`${err}`));
  }, [token, code]);
  return (
    <>
      <div />
      <div>
        <p>Enter the 6-digit code from your authenticator app</p>
      </div>
      <div>Code:</div>
      <div>
        <input
          type="text"
          name="2facode"
          autofill="new-password"
          size={6}
          value={code}
          onInput={evt => setCode(evt.target.value)}
        />
      </div>
      <div />
      <div>
        <input
          type="button"
          value="Login"
          disabled={code.length != 6}
          onClick={onAuth}
        />
      </div>
    </>
  );
};

export default TwoFactor;
