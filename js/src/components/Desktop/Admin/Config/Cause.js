import React from 'react';
import _JSXStyle from 'styled-jsx/style';

export const Cause = ({ cause }) => {
  if (!cause || cause.length === 0) {
    return null;
  }
  return (
    <div className="cause">
      <style jsx>{`
        .cause {
          grid-column: 1 / span 2;
          text-align: center;
        }
      `}</style>
      <h1>Synos Running in Safe Mode</h1>
      <div>
        <p>The server is running in safe mode because of the following error:</p>
        <p>{cause[0]}</p>
        {cause.length > 1 ? (
          <>
            <p>Additional Details:</p>
            <ul>
              {cause.slice(1).map((err, i) => (<li key={i}>{err}</li>))}
            </ul>
          </>
        ) : null}
        <p>You may update the server configuration below, if necessary to correct the problem</p>
      </div>
    </div>
  );
};

export default Cause;
