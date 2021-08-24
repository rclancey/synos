import React, { useMemo } from 'react';

const isoTimeFmt = Intl.DateTimeFormat('en-US', {
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
});

export const TimeInput = ({ value, onInput, ...props }) => {
  const myOnInput = useMemo(() => {
    if (!onInput) {
      return null;
    }
    return (val) => {
      if (val === null) {
        return null;
      }
      try {
        const dt = new Date(`1970-01-01T${val}Z`);
        onInput(dt.getTime());
      } catch (err) {
        onInput(null);
      }
    };
  }, [onInput]);
  const time = useMemo(() => {
    if (value === null || value === undefined) {
      return null;
    }
    return fmt.format(new Date(value));
  }, [value]);
  return (
    <TextInput type="time" value={time} onInput={myOnInput} {...props} />
  );
};

export default TimeInput;
