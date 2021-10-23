import React, { useContext } from 'react';
import _JSXStyle from 'styled-jsx/style';

import LoginContext from '../../../context/LoginContext';
import Button from '../../Input/Button';

export const Logout = () => {
  const { onLogout } = useContext(LoginContext);
  return (
    <div>
      <style jsx>{`
        div {
          text-align: center;
        }
      `}</style>
      <Button onClick={onLogout}>Logout</Button>
    </div>
  );
};

export default Logout;
