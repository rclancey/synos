import React, { useState, useEffect, useCallback, useMemo } from 'react';
import zxcvbn from 'zxcvbn';

import Check from '../Check';
import PasswordStrength from './PasswordStrength';

export const ResetPasswordForm = ({ token, onChange }) => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [codeFromUrl, setCodeFromUrl] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const strength = useMemo(() => {
    if (password) {
      return zxcvbn(password);
    }
    return { score: -1 };
  }, [password]);
  const onReset = useCallback(() => {
    console.debug('onReset');
    if (username === '' || code === '') {
      setError('Missing reset code');
      return;
    }
    if (password === '') {
      setError('Missing new password');
      return;
    }
    if (strength.score < 3) {
      setError('New password is too weak');
      return;
    }
    if (password !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setError(null);
    token.changePassword({ username, reset_code: code, new_password: password })
      .then((resp) => {
        console.debug('change password response: %o', resp);
        onChange(resp);
      })
      .catch((err) => setError(`${err}`));
  }, [username, code, password, confirmPassword]);
  const onEnter = useCallback((evt) => {
    if (evt.key === 'Enter') {
      onReset();
    }
  }, [onReset]);
  useEffect(() => {
    const u = new URL(document.location);
    setUsername(u.searchParams.get('username'));
    if (u.searchParams.has('code')) {
      setCode(u.searchParams.get('code'));
      setCodeFromUrl(true);
    }
  }, []);
  return (
    <>
      <div className="header">Synos: Reset Password</div>
      <div>Username:</div>
      <div>{username}</div>
      { codeFromUrl ? null : (
        <>
          <div className="colspan2">
            <p>Check your email for a code to enter below:</p>
          </div>
          <div>Reset Code:</div>
          <div>
            <input
              type="text"
              name="reset_code"
              size="15"
              autocomplete="new-password"
              value={code}
              onInput={evt => setCode(evt.target.value)}
              onKeyDown={onEnter}
              onKeyUp={onEnter}
              onKeyPress={onEnter}
            />
          </div>
        </>
      ) }

      <div>New Password:</div>
      <div className="newPassword">
        <div className="wrap">
          <input
            type="password"
            name="new_password"
            size="15"
            autocomplete="new-password"
            value={password}
            onInput={evt => setPassword(evt.target.value)}
            onKeyDown={onEnter}
            onKeyUp={onEnter}
            onKeyPress={onEnter}
          />
          <br />
          <PasswordStrength score={strength.score} />
        </div>
        <Check valid={strength.score >= 3} />
      </div>
      <div>Confirm Password:</div>
      <div className="confirmPassword">
        <input
          type="password"
          name="confirm_password"
          size="15"
          autocomplete="new-password"
          value={confirmPassword}
          onInput={evt => setConfirmPassword(evt.target.value)}
          onKeyDown={onEnter}
          onKeyUp={onEnter}
          onKeyPress={onEnter}
        />
        <Check valid={password && confirmPassword === password} />
      </div>
      { error !== null ? (
        <><div /><div className="error">{error}</div></>
      ) : null }
      <div className="colspan2 center">
        <input
          type="button"
          value="Reset Password"
          disabled={!code || password === '' || strength.score < 3 || password !== confirmPassword}
          onClick={onReset}
        />
      </div>

    </>
  );
};

export default ResetPasswordForm;
