import React, { useState, useEffect, useCallback, useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';

import DarkMode from './DarkMode';
import ThemeChooser from './ThemeChooser';
import ChangePassword from './ChangePassword';
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
          overflow: auto;
        }
        .settings .section {
          display: grid;
          grid-template-columns: auto auto;
          align-items: baseline;
        }
        .settings .section>:global(div) {
          margin-top: 10px;
          margin-right: 4px;
        }
        .settings :global(select) {
          font-size: 12pt;
          padding: 3px;
        }
        .settings hr {
          grid-column: span 2;
          width: 100%;
          border: none;
          border-bottom: solid var(--border) 1px;
          margin-top: 20px;
        }
        .settings :global(svg) {
          width: 12px;
          height: 12px;
          margin-left: 5px;
        }
        .settings .colspan2 {
          grid-column: span 2;
        }
        .settings :global(.newPassword) {
          display: flex;
          align-items: baseline;
        }
        .settings :global(input) {
          font-size: 12pt;
          padding: 3px 5px;
        }
        .settings>.colspan2 {
          grid-column: span 2;
          margin-top: 12px;
          text-align: center;
        }
        .settings :global(.recoveryKeys) {
          display: block !important;
        }
      `}</style>
      <div className="section">
        <DarkMode />
        <ThemeChooser />
      </div>
      <hr />
      <div className="section">
        <ChangePassword />
      </div>
      {twoFactor ? (
        <TwoFactor onClose={() => setTwoFactor(false)} />
      ) : (
        <div className="colspan2">
          <button onClick={() => setTwoFactor(true)}>Setup Two Factor Authentication</button>
        </div>
      )}
      <hr />
      <div className="section">
        <ChangeProfileInfo />
      </div>
      <hr />
      <Logout />
    </div>
  );
};

export default Settings;
