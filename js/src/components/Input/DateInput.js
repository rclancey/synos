import React, { useMemo } from 'react';

import TextInput from './TextInput';

const fmt = Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: 'numeric', day: 'numeric' });

export const DateInput = ({ value, onInput, ...props }) => {
  const myOnInput = useMemo(() => {
    if (!onInput) {
      return null;
    }
    return (val) => onInput(new Date(`${val}T00:00:00`).getTime());
  }, [onInput]);
  const date = useMemo(() => {
    if (value === null || value === undefined) {
      return '';
    }
    return fmt.format(new Date(value));
  }, [value]);
  return (
    <TextInput type="date" value={date} onInput={myOnInput} {...props} />
  );
};

export default DateInput;
