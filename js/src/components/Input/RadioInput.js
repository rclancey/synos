import React, { useMemo, useCallback } from 'react';

import { valueLabel, valueKey } from './MenuInput';

export const RadioInput = ({
  option,
  group,
  name,
  value,
  onChange,
}) => {
  const id = useMemo(() => Math.random().toString(), []);
  const myOnChange = useCallback(() => onChange(option), [onChange, option]);
  const label = valueLabel(option);
  if (!onChange) {
    return (
      <span>
        {label.value === value ? '\u25cf' : '\u25cb'}
        {`\u00a0${value}`}
      </span>
    );
  }
  return (
    <>
      <input
        id={id}
        type="radio"
        name={group || name || id}
        checked={label.value === value}
        value={value}
        onChange={myOnChange}
      />
      <label htmlFor={id}>{`${label.label}`}</label>
    </>
  );
};

export const RadioGroup = ({ options, ...props }) => {
  const group = useMemo(() => Math.random().toString(), []);
  return options.map((opt) => (
    <RadioInput key={valueKey(opt)} group={group} option={opt} {...props} />
  ));
};

export default RadioGroup;
