import React, { useCallback, useEffect, useMemo, useState } from 'react';

import LoginContext from '../../context/LoginContext';
import Token, { LOGIN_STATE } from './token';
import LoginForm from './LoginForm';
import UsernamePasswordForm from './UsernamePasswordForm';
import TwoFactor from './TwoFactor';

const getToken = () => {
  const t = Token();
  if (t.expired()) {
    return null;
  }
  return t;
};

export const WithLogin = ({ children }) => {
  const token = useMemo(() => new Token(), []);
  const [loginState, setLoginState] = useState(token.state);
  const [username, setUsername] = useState(token.username);
  const [userinfo, setUserinfo] = useState(null);
  useEffect(() => {
    const h = () => {
      setLoginState(token.state);
      setUsername(token.username);
      setUserinfo(token.userinfo);
    };
    token.on('login', h);
    token.on('logout', h);
    token.on('expire', h);
    token.on('2fa', h);
    token.on('info', h);
    return () => {
      token.dispose();
    };
  }, [token]);
  const onLogout = useCallback(() => token.logout(), [token]);
  const onLoginRequired = useCallback(() => token.updateFromCookie(), [token]);
  const ctx = useMemo(() => ({
    token,
    username,
    userinfo,
    loginState,
    onLoginRequired,
    onLogout,
  }), [token, username, userinfo, loginState, onLoginRequired, onLogout]);
  switch (loginState) {
    case LOGIN_STATE.LOGGED_OUT:
    case LOGIN_STATE.EXPIRED:
      return (
        <LoginForm>
          <UsernamePasswordForm username={username} token={token} />
        </LoginForm>
      );
    case LOGIN_STATE.NEEDS_2FA:
      return (
        <LoginForm>
          <TwoFactor token={token} />
        </LoginForm>
      );
    case LOGIN_STATE.LOGGED_IN:
      return (
        <LoginContext.Provider value={ctx}>
          {children}
        </LoginContext.Provider>
      );
    default:
      return (<LoginForm token={token} />);
  }
};

export default WithLogin;
