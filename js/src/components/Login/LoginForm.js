import React from 'react';

import { Center } from '../Center';

export const LoginForm = ({ children }) => (
  <div id="app" className="login">
    <Center orientation="horizontal" style={{ width: '100vw', height: '100vh' }}>
      <Center orientation="vertical">
        <div className="login">
          {children}
        </div>
      </Center>
    </Center>
  </div>
);

export default LoginForm;
