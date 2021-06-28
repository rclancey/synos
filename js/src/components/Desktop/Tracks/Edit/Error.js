import React from 'react';

export const Error = ({ error }) => {
  if (!error) {
    return null;
  }
  return (
    <div style={{ marginTop: '1em', color: 'red', fontWeight: 'bold' }}>
      {typeof error === 'string' ? error : error.toString()}
    </div>
  );
};
