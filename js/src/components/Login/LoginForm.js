import React from 'react';
import _JSXStyle from 'styled-jsx/style';

import { Center } from '../Center';
import Grid from '../Grid';

export const LoginForm = ({ children }) => (
  <div id="app">
    <style jsx>{`
      :global(.grid.login) {
        grid-template-columns: min-content min-content !important;
      }
    `}</style>
    <Center orientation="horizontal" style={{ width: '100vw', height: '100vh' }}>
      <Center orientation="vertical">
        <Grid className="login">
          {children}
        </Grid>
      </Center>
    </Center>
  </div>
);

export default LoginForm;
