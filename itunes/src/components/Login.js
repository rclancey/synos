import React, { useState, useRef, useEffect } from 'react';
import base64 from 'base-64';

const doLogin = (username, password) => {
  const headers = new Headers();
  if (username !== undefined && username !== null && username !== '' && password !== undefined && password !== null && password !== '') {
    headers.set('Authorization', 'Basic ' + base64.encode(username + ":" + password));
  }
  return fetch('/api/login', {
    method: 'POST',
    credientials: 'include',
    headers,
  })
    .then(resp => {
      if (resp.status === 200) {
        return resp.json();
      }
      return { status: resp.statusText };
    })
    .then(resp => {
      return resp.status === 'OK';
    });
};

export const CheckLogin = ({ mobile, theme, loggedIn, onLogin, children }) => {
  const checkRef = useRef(false);
  useEffect(() => {
    if (checkRef.current === false) {
      checkRef.current = true;
      doLogin(null, null)
        .then(stat => {
          console.debug('login stat: %o', stat);
          if (stat) { onLogin(true) }
          else { onLogin(false) }
        });
    }
  });
  if (loggedIn) {
    console.debug('logged in, displaying children');
    return children;
  }
  console.debug('not logged in, displaying login form');
  return <Login mobile={mobile} theme={theme} onLogin={() => onLogin(true)} />;
};

export const Login = ({ mobile, theme, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  return (
    <div id="app" className={`login ${mobile ? "mobile" : "desktop"} ${theme}`}>
      <div className="leftPad" />
      <div className="centerPad">
        <div className="topPad" />
        <div className="login">
          <div className="header">Synos: Login Required</div>
          <div>Username:</div>
          <div><input type="text" value={username} onChange={evt => setUsername(evt.target.value)} /></div>
          <div>Password:</div>
          <div><input type="password" value={password} onChange={evt => setPassword(evt.target.value)} /></div>
          { error !== null ? (<>
            <div />
            <div className="error">{error}</div>
          </>) : null }
          <div />
          <div>
            <input
              type="button"
              value="Login"
              onClick={() => {
                doLogin(username, password)
                  .then(stat => {
                    if (stat) { setError(null); onLogin && onLogin() }
                    else { setError("Login incorrect") }
                  });
              }}
            />
          </div>
          {/*
          <table>
            <tbody>
              <tr>
                <td>Username:</td>
                <td><input type="text" value={username} onChange={evt => setUsername(evt.target.value)} /></td>
              </tr>
              <tr>
                <td>Password:</td>
                <td><input type="password" value={password} onChange={evt => setPassword(evt.target.value)} /></td>
              </tr>
              { error !== null ? (
                <tr className="error">
                  <td></td>
                  <td>{error}</td>
                </tr>
              ) : null }
              <tr>
                <td></td>
                <td>
                  <input
                    type="button"
                    value="Login"
                    onClick={() => {
                      doLogin(username, password)
                        .then(stat => {
                          if (stat) { setError(null); onLogin && onLogin() }
                          else { setError("Login incorrect") }
                        });
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          */}
        </div>
        <div className="bottomPad" />
      </div>
      <div className="rightPad" />
    </div>
  );
};
