import React, { useMemo } from 'react';

import TextInput from './TextInput';

export const NumberInput = ({ onInput, ...props }) => {
  const myOnInput = useMemo(() => {
    if (!onInput) {
      return null;
    }
    return (val) => {
      const f = parseFloat(val);
      if (Number.isNaN(f)) {
        onInput(null);
      } else {
        onInput(f);
      }
    };
  }, [onInput]);
  return (
    <TextInput type="number" onInput={myOnInput} {...props} />
  );
};

export default NumberInput;
