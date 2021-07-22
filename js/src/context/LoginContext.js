import React from 'react';

export const LoginContext = React.createContext({
  token: null,
  username: null,
  loginState: 0,
  onLoginRequired: () => console.debug('login required'),
  onLogout: () => console.debug('logout'),
});

export default LoginContext;
