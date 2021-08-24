import React, { useContext } from 'react';

import LoginContext from '../../../context/LoginContext';

export const Logout = () => {
  const { onLogout } = useContext(LoginContext);
  return (
    <div>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
};

export default Logout;
