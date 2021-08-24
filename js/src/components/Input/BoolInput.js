import React, { useMemo, useCallback } from 'react';

export const BoolInput = ({
  type,
  label,
  checked,
  value,
  onChange,
  ...props
}) => {
  const id = useMemo(() => Math.random().toString(), []);
  const myOnChange = useCallback((evt) => onChange(evt.target.checked), [onChange]);
  if (!onChange) {
    return !!value ? '\u2713' : '\u00a0';
  }
  return (
    <>
      <input
        id={id}
        type="checkbox"
        value="true"
        checked={!!value}
        onChange={myOnChange}
        {...props}
      />
      { label ? (<label htmlFor={id}>{label}</label>) : null }
    </>
  );
};

export default BoolInput;
