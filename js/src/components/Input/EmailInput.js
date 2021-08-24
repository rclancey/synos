import React, { useState, useEffect, useMemo } from 'react';

import TextInput from './TextInput';

const validate = (value) => {
  if (!value) {
    return true;
  }
  const parts = value.split(/@/);
  if (parts.length != 2) {
    return false;
  }
  if (parts[0].match(/[^0-9A-Za-z\+\._\-]/)) {
    return false;
  }
  const domain = parts[1].split('.');
  if (domain.length < 2) {
    return false;
  }
  if (parts[1].match(/[^0-9A-Za-z\-\.]/)) {
    return false;
  }
  if (parts[1].match(/--/)) {
    return false;
  }
  if (domain.some((name) => name === '')) {
    return false;
  }
  if (domain.some((name) => (name.startsWith('-') || name.endsWith('-')))) {
    return false;
  }
  return true;
};

export const EmailInput = ({ value, placeholder = 'username@domain.com', ...props }) => {
  const valid = useMemo(() => validate(value), [value]);
  return (
    <TextInput
      type="email"
      value={value}
      valid={valid}
      placeholder={placeholder}
      {...props}
    />
  )
};

export default EmailInput;
