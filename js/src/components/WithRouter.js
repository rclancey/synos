import React, { useCallback, useContext } from 'react';

import RouterContext, { useRouter } from '../context/RouterContext';

const WithRouter = ({ children }) => {
  const ctx = useRouter();
  return (
    <RouterContext.Provider value={ctx}>
      {children}
    </RouterContext.Provider>
  );
};

export default WithRouter;
