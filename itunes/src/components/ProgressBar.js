import React from 'react';
import logo from '../logo.svg';

export const ProgressBar = ({ total, complete }) => {
  if (complete >= total || total <= 0) {
    return null;
  }
  return (
    <div id="loading">
      <img src={logo} className="App-logo" />
      <div className="progress">
        <div className="complete" style={{ width: (100 * complete / total)+'%' }} />
      </div>
    </div>
  );
}

