import React, { useMemo } from 'react';

import TextInput from './TextInput';

export const IntegerInput = ({ step = 1, onInput, ...props }) => {
  const myOnInput = useMemo(() => {
    if (!onInput) {
      return null;
    }
    return (val) => {
      const n = parseInt(val, 10);
      if (Number.isNaN(n)) {
        onInput(null);
      } else {
        onInput(n);
      }
    };
  }, [onInput]);
  return (
    <TextInput type="number" step={step} onInput={myOnInput} {...props} />
  );
};

export default IntegerInput;
