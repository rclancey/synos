import React, { useState, useRef, useEffect, useMemo } from 'react';
import { checkLoginCookie, doLogin, LoginContext } from '../lib/login';
import { useTheme } from '../lib/theme';
import { Center } from './Center';

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
  const colors = useTheme();
  const [tmpUsername, setUsername] = useState(username);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const formFactor = mobile ? 'mobile' : 'desktop';
  return (
    <div id="login">
      <Center orientation="horizontal" style={{ height: '100vh' }}>
        <Center orientation="vertical">
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
        </Center>
      </Center>
      <style jsx>{`
        #login {
          background-color: ${colors.background};
        }
        .login {
          flex: 1;
          border-style: solid;
          border-width: 1px;
          border-radius: 8px;
          padding: 2em;
          display: grid;
          grid-template-columns: min-content min-content;
          grid-column-gap: 10px;
          grid-row-gap: 10px;
          border-color: ${colors.login.border};
          color: ${colors.login.text};
          box-shadow: ${colors.login.shadow} 0px 0px 50px 20px;
        }
        .login .header {
          grid-column: span 2;
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          padding: 0 0 1em 0;
        }
        .login input {
          border-style: solid;
          border-width: 1px;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12pt;
          border-color: ${colors.login.text};
          background-color: ${colors.login.background};
          color: ${colors.login.text};
        }
        .login input[type="button"] {
          font-weight: bold;
          background-image: linear-gradient(${colors.login.gradient1}, ${colors.login.gradient2});
        }
      `}</style>
    </div>
  );
};
