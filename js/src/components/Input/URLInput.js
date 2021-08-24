import React, { useCallback } from 'react';

import TextInput from './TextInput';

const validate = (value) => {
  if (!value) {
    return true;
  }
  try {
    const u = new URL(value);
  } catch (err) {
    return false;
  }
  return true;
};

export const URLInput = ({ value, placeholder = 'https://www.example.com/', onInput, ...props }) => {
  const valid = useMemo(() => validate(value), [value]);
  if (!onInput) {
    return (<a href={value}>{value}</a>);
  }
  return (
    <TextInput
      type="url"
      value={value}
      valid={valid}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default URLInput;
