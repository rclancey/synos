import React, { useState, useEffect, useCallback, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';

import Button from '../Input/Button';
import { ChangePassword } from '../Password';
import ThemeChooser from './ThemeChooser';
import TwoFactor from './TwoFactor';
import ChangeProfileInfo from './ChangeProfileInfo';
import Logout from './Logout';

export const Settings = ({
}) => {
  const [twoFactor, setTwoFactor] = useState(false);
  return (
    <div className="settings">
      <style jsx>{`
        .settings {
          position: absolute;;
          box-sizing: border-box;
          top: 50px;
          width: 100vw;
          height: calc(100vh - 120px);
          padding: 1em;
          padding-top: 0px;
          overflow: overlay;
        }
        .settings hr {
          grid-column: span 2;
          width: 100%;
          border: none;
          border-bottom: solid var(--border) 1px;
          margin-top: 20px;
        }
        .settings>.colspan2 {
          margin-top: 12px;
          text-align: center;
        }
      `}</style>
      <ThemeChooser />
      <hr />
      <ChangePassword />
      {twoFactor ? (
        <TwoFactor onClose={() => setTwoFactor(false)} />
      ) : (
        <div className="colspan2">
          <Button type="secondary" onClick={() => setTwoFactor(true)}>
            Setup Two Factor Authentication
          </Button>
        </div>
      )}
      <hr />
      <ChangeProfileInfo />
      <hr />
      <Logout />
    </div>
  );
};

export default Settings;
