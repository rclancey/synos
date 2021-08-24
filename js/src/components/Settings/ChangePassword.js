import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import zxcvbn from 'zxcvbn';

import LoginContext from '../../context/LoginContext';
import Check from '../Check';
import PasswordStrength from '../Login/PasswordStrength';

export const ChangePassword = () => {
  const { username, token } = useContext(LoginContext);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const strength = useMemo(() => {
    if (newPassword) {
      return zxcvbn(newPassword);
    }
    return { score: -1 };
  }, [newPassword]);
  const onChange = useCallback(() => {
    if (password === '') {
      setError('Missing current password');
      return;
    }
    if (newPassword === '') {
      setError('Missing new password');
      return;
    }
    if (strength.score < 3) {
      setError('New password is too weak');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    token.changePassword({ username, password, new_password: newPassword })
      .then((resp) => {
        console.debug('change password response: %o', resp);
        onChange(resp);
      })
      .catch((err) => setError(`${err}`));
  }, [username, password, newPassword, confirmPassword]);
  const onEnter = useCallback((evt) => {
    if (evt.key === 'Enter') {
      onChange();
    }
  }, [onChange]);

  return (
    <>
      <div>Current Password:</div>
      <div>
        <input
          type="password"
          name="password"
          size="15"
          value={password}
          onInput={evt => setPassword(evt.target.value)}
        />
      </div>
      <div>New Password:</div>
      <div className="newPassword">
        <div className="wrap">
          <input
            type="password"
            name="new_password"
            size="15"
            autocomplete="new-password"
            value={newPassword}
            onInput={evt => setNewPassword(evt.target.value)}
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
        <Check valid={newPassword && confirmPassword === newPassword} />
      </div>
      { error !== null ? (
        <><div /><div className="error">{error}</div></>
      ) : null }
      <div />
      <div>
        <button
          disabled={password === '' || newPassword === '' || strength.score < 3 || newPassword !== confirmPassword}
          onClick={onChange}
        >
          Update Password
        </button>
      </div>
    </>
  );
};

export default ChangePassword;
