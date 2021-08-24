import React, { useState, useMemo, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import Button from '../Input/Button';
import { ChangePassword } from '../Password';
import ThemeChooser from '../Settings/ThemeChooser';
import TwoFactor from '../Settings/TwoFactor';
import ChangeProfileInfo from '../Settings/ChangeProfileInfo';
import Logout from '../Settings/Logout';
import { Dialog } from './Dialog';

export const Settings = ({ onClose }) => {
  const [twoFactor, setTwoFactor] = useState(false);
  const style = useMemo(() => ({
    top: `calc(50vh - ${twoFactor ? 310 : 275}px)`,
    height: (twoFactor ? '620px' : '550px'),
    maxHeight: '100vh',
  }), [twoFactor]);
  return (
    <Dialog
      title="Settings"
      width={750}
      style={style}
      onDismiss={onClose}
    >
    <div className="settings">
      <style jsx>{`
        .settings hr {
          width: 100%;
          border: none;
          border-bottom: solid var(--border) 1px;
          margin-top: 20px;
        }
        .colspan2 {
          margin-top: 12px;
          text-align: center;
        }
      `}</style>
      {twoFactor ? (
        <TwoFactor onClose={() => setTwoFactor(false)} />
      ) : (
        <>
          <ThemeChooser />
          <hr />
          <ChangePassword />
          <div className="colspan2">
            <Button type="secondary" onClick={() => setTwoFactor(true)}>
              Setup Two Factor Authentication
            </Button>
          </div>
          <hr />
          <ChangeProfileInfo />
          <hr />
          <Logout />
        </>
      )}
    </div>
    </Dialog>
  );
};

export default Settings;
