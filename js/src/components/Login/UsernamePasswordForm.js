import React, { useState, useEffect, useCallback } from 'react';

import { Username, Password } from '../Password';
import Button from '../Input/Button';
import ResetPasswordForm from './ResetPasswordForm';
import SocialLoginForm from './SocialLoginForm';

export const UsernamePasswordForm = ({ username = '', token }) => {
  const [tmpUsername, setUsername] = useState(username || '');
  const [password, setPassword] = useState('');
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState(null);
  const onLogin = useCallback(() => token.login(tmpUsername, password)
    .then(() => setError(null))
    .catch((err) => setError(`${err}`)), [token, tmpUsername, password]);
  const onEnter = useCallback((evt) => {
    if (tmpUsername && password) {
      onLogin();
    } else if (tmpUsername) {
      evt.target.form.elements.password.focus();
    } else {
      evt.target.form.elements.username.focus();
    }
  }, [tmpUsername, password, onLogin]);
  const onChange = useCallback(() => {
    const u = new URL(document.location);
    const state = {};
    u.searchParams.delete('reset');
    history.pushState(state, 'Login', u.toString());
    setForgot(false);
  }, []);
  const onForgot = useCallback(() => {
    console.debug('onForgot');
    token.resetPassword(tmpUsername)
      .then((resp) => {
        console.debug('reset password response: %o', resp);
        const u = new URL(document.location);
        const state = {
          reset: true,
          username: tmpUsername,
        };
        u.searchParams.set('reset', true);
        u.searchParams.set('username', tmpUsername);
        history.pushState(state, 'Reset Password', u.toString());
        setForgot(true);
      });
  }, [token, tmpUsername]);
  useEffect(() => {
    const h = () => {
      const u = new URL(document.location);
      if (u.searchParams.get('reset') !== null) {
        setForgot(true);
      } else {
        setForgot(false);
      }
    };
    window.addEventListener('popstate', h);
    h();
    return () => {
      window.removeEventListener('popstate', h);
    };
  }, []);
  if (forgot) {
    return (
      <ResetPasswordForm username={tmpUsername} token={token} onChange={onChange} />
    );
  }
  return (
    <>
      <div className="header">Synos: Login Required</div>
      <div>Username:</div>
      <div>
        <Username value={tmpUsername} onChange={setUsername} onEnter={onEnter} />
      </div>
      <div>Password:</div>
      <div>
        <Password value={password} onChange={setPassword} onEnter={onEnter} />
      </div>
      { error !== null ? (<>
        <div />
        <div className="error">{error}</div>
      </>) : null }
      <div />
      <div>
        <Button onClick={onLogin}>Login</Button>
      </div>
      <div />
      <div>
        <Button type="text" disabled={tmpUsername === ''} onClick={onForgot}>I forgot my password</Button>
      </div>
      <SocialLoginForm />
    </>
  );
};

export default UsernamePasswordForm;
