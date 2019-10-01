import React from 'react';
import base64 from 'base-64';

const getCookie = (name) => {
  return document.cookie.split(/;\s*/)
    .map(cookie => {
      const parts = cookie.split(/=/);
      const name = unescape(parts.shift());
      const value = unescape(parts.join('='));
      return { name, value };
    })
    .find(cookie => cookie.name === name);
};

export const checkLoginCookie = () => {
  const login = { loggedIn: false, username: null };
  const cookie = getCookie("auth");
  if (!cookie) {
    return login;
  }
  try {
    const parts = cookie.value.split('.');
    const jwt = JSON.parse(base64.decode(parts[1]));
    login.username = jwt.jti;
    if (jwt.exp * 1000 > Date.now()) {
      login.loggedIn = true;
    }
  } catch (err) {
    console.error(err);
  }
  return login;
};

export const doLogin = (username, password) => {
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
      throw new Error(resp.statusText);
    })
    .then(resp => {
      if (resp.status !== 'OK') {
        throw new Error("Login Incorrect");
      }
      return { loggedIn: true, username };
    });
};

export const LoginContext = React.createContext({
  username: null,
  loggedIn: false,
  onLoginRequired: () => console.debug('login required'),
});
