import React, { useContext } from 'react';

import RouterContext from '../../lib/router';

export const Header = ({ prev, children }) => {
  const { popState } = useContext(RouterContext);
  return (
    <div className="header">
      <BackButton prev={prev} onClick={popState} />
      {children>
    </div>
  );
};

export default Header;
