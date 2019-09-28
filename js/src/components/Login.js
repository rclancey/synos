import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { checkLoginCookie, doLogin, LoginContext } from '../lib/login';
import { ThemeContext } from '../lib/theme';

export const CheckLogin = ({ mobile, children }) => {
  const [login, setLogin] = useState({ loggedIn: null, username: null });
  useEffect(() => {
    setLogin(checkLoginCookie());
  }, []);
  const onLoginRequired = useMemo(() => {
    return () => setLogin(orig => Object.assign({}, orig, { loggedIn: false }));
  }, [setLogin]);
  const onLogin = useMemo(() => {
    return (username, password) => doLogin(username, password).then(setLogin);
  }, [setLogin])
  const ctx = useMemo(() => {
    return { ...login, onLoginRequired };
  }, [login, onLoginRequired]);
  if (login.loggedIn === null) {
    return null;
  }
  if (login.loggedIn) {
    return (
      <LoginContext.Provider value={ctx}>
        {children}
      </LoginContext.Provider>
    );
  }
  return (
    <Login mobile={mobile} username={login.username} onLogin={onLogin} />
  );
};

export const Login = ({ mobile, username, onLogin }) => {
  const theme = useContext(ThemeContext);
  const [tmpUsername, setUsername] = useState(username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const formFactor = mobile ? 'mobile' : 'desktop';
  return (
    <div id="app" className={`login ${formFactor} ${theme}`}>
      <div className="leftPad" />
      <div className="centerPad">
        <div className="topPad" />
        <div className="login">
          <div className="header">Synos: Login Required</div>
          <div>Username:</div>
          <div>
            <input
              type="text"
              value={tmpUsername}
              onChange={evt => setUsername(evt.target.value)}
            />
          </div>
          <div>Password:</div>
          <div>
            <input
              type="password"
              value={password}
              onChange={evt => setPassword(evt.target.value)}
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
        </div>
        <div className="bottomPad" />
      </div>
      <div className="rightPad" />
    </div>
  );
};
