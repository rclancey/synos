import React from 'react';
import _JSXStyle from 'styled-jsx/style';
import zxcvbn from 'zxcvbn';

export const PasswordStrength = ({ score }) => (
  <div className="passwordStrength">
    <style jsx>{`
      .passwordStrength {
        width: 100%;
        display: flex;
        flex-direction: row;
        margin-top: 5px;
        opacity: 0.7;
      }
      .passwordStrength>div {
        flex: 1;
        height: 5px;
        border-radius: 5px;
        margin-left: 2px;
        background-color: var(--blur-background);
      }
      .passwordStrength>div:first-child {
        margin-left: 0px;
      }
      .passwordStrength>div.red.on {
        background-color: red;
      }
      .passwordStrength>div.orange.on {
        background-color: orange;
      }
      .passwordStrength>div.yellow.on {
        background-color: yellow;
      }
      .passwordStrength>div.green.on {
        background-color: green;
      }
    `}</style>
    <div className={`red ${score >= 0 ? 'on' : 'off'}`} />
    <div className={`orange ${score >= 1 ? 'on' : 'off'}`} />
    <div className={`yellow ${score >= 2 ? 'on' : 'off'}`} />
    <div className={`green ${score >= 3 ? 'on' : 'off'}`} />
    <div className={`green ${score >= 4 ? 'on' : 'off'}`} />
  </div>
);

export default PasswordStrength;
