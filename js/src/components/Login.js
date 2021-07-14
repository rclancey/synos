import React, { useState, useEffect, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { checkLoginCookie, doLogin, LoginContext } from '../lib/login';
import { useTheme } from '../lib/theme';
import { Center } from './Center';

export const CheckLogin = ({ theme, dark, children }) => {
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
    <Login theme={theme} dark={dark} username={login.username} onLogin={onLogin} />
  );
};

export const Login = ({ theme, dark, username, onLogin }) => {
  const colors = useTheme();
  const [tmpUsername, setUsername] = useState(username || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  return (
    <div id="app" className={`${theme} ${dark ? 'dark' : 'light'}`}>
      <Center orientation="horizontal" style={{ height: '100vh' }}>
        <Center orientation="vertical">
          <div className="login">
            <div className="header">Synos: Login Required</div>
            <div>Username:</div>
            <div>
              <input
                type="text"
                value={tmpUsername}
                onInput={evt => setUsername(evt.target.value)}
              />
            </div>
            <div>Password:</div>
            <div>
              <input
                type="password"
                value={password}
                onInput={evt => setPassword(evt.target.value)}
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
            <div className="social">
              <a href="/api/login/github" className="github">
                <span className="logo">{'\u00a0'}</span>
                Login with GitHub
              </a>
              <a href="/api/login/google" className="google">
                <span className="logo">{'\u00a0'}</span>
                Sign in with Google
              </a>
              <a href="/api/login/amazon" className="amazon">
                <span className="fab fa-amazon"/>
                Login with Amazon
              </a>
              {/*
              <a href="/auth/facebook" className="facebook">
                <span className="logo">{'\u00a0'}</span>
                Login with Facebook
              </a>
              */}
              {/*
              <a href="/auth/apple" className="apple">
                <span className="fab fa-apple"/>
                Sign in with Apple
              </a>
              */}
            </div>
          </div>
        </Center>
      </Center>
      <style jsx>{`
        #app {
          background: var(--gradient-end);
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
          border-color: transparent;
          color: var(--text);
          box-shadow: var(--gradient-start) 0px 0px 50px 20px;
          background: var(--gradient);
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
          border-color: var(--border);
          background-color: var(--gradient-end);
          color: var(--text);
        }
        .login input:focus-visible {
          outline: var(--highlight) auto 1px;
        }
        .login input[type="button"] {
          font-weight: bold;
          background-image: linear-gradient(var(--gradient-start), var(--gradient-end));
          border-color: var(--highlight);
        }
        .login .social {
          grid-column: span 2;
        }
        .login .social a {
          display: block;
          width: calc(100% - 2em);
          margin: 5px 1em 2px 1em;
          padding: 0.5em;
          border: solid var(--border) 1px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          font-size: 18px;
        }
        .login .social a span {
          display: inline-block;
          margin-right: 1em;
          margin-left: 0.5em;
          font-size: 18;
        }
        .login .social a.github {
          color: white;
          background-color: black;
          border-color: black;
        }
        .login .social a.github .logo {
          width: 18px;
          height: auto;
          background-image: url(/assets/logos/github/logo.png);
          background-repeat: no-repeat;
          background-position: center;
          background-size: 18px 18px;
        }
        .login .social a.google {
          color: black;
          background-color: white;
          border-color: #ccc;
        }
        .login .social a.google .logo {
          width: 18px;
          height: auto;
          background-image: url(assets//logos/google/logo.svg);
          background-repeat: no-repeat;
          background-position: center;
        }
        .login .social a.amazon {
          color: black;
          background-color: #f9991d;
          background-image: linear-gradient(#ffe8aa, #f5c646);
          border-color: #b38b22;
        }
        .login .social a.facebook {
          color: white;
          background-color: #4267b2;
          border-color: #4267b2;
        }
        .login .social a.facebook .logo {
          width: 18px;
          height: auto;
          background-image: url(/assets/logos/facebook/logo.png);
          background-repeat: no-repeat;
          background-position: center;
          background-size: 18px 18px;
        }
        .login .social a.apple {
          color: white;
          background-color: black;
          border-color: white;
        }
      `}</style>
    </div>
  );
};
