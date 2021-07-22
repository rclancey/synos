import React, { useState, useEffect, useCallback } from 'react';

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
    console.debug(evt);
  }, []);
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
        <input
          type="text"
          value={tmpUsername}
          onInput={evt => setUsername(evt.target.value)}
          onKeyDown={onEnter}
          onKeyUp={onEnter}
          onKeyPress={onEnter}
        />
      </div>
      <div>Password:</div>
      <div>
        <input
          type="password"
          value={password}
          onInput={evt => setPassword(evt.target.value)}
          onKeyDown={onEnter}
          onKeyUp={onEnter}
          onKeyPress={onEnter}
        />
      </div>
      { error !== null ? (<>
        <div />
        <div className="error">{error}</div>
      </>) : null }
      <div />
      <div>
        <input
          type="button"
          value="Login"
          onClick={() => onLogin(tmpUsername, password).catch(err => setError(err.message))}
        />
      </div>
      <div />
      <div>
        <p className="forgot" onClick={onForgot}>
          I forgot my password
        </p>
      </div>
      <SocialLoginForm />
    </>
  );
};

export default UsernamePasswordForm;
