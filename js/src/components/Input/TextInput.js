import React, { useCallback } from 'react';

export const TextInput = ({ type = 'text', value, valid = true, onInput, ...props }) => {
  const myOnInput = useCallback((evt) => onInput(evt.target.value), [onInput]);
  if (!onInput && !props.hidden) {
    if (value === null || value === undefined || value === '') {
      return '\u00a0';
    }
    if (typeof value !== 'string') {
      return `${value}`;
    }
    return value;
  }
  return (
    <input
      type={type}
      value={value === null || value === undefined ? '' : value}
      valid={valid}
      onInput={myOnInput}
      {...props}
    >
      <style jsx>{`
        input {
          background: #fcc;
          color: #900;
          border: solid var(--border) 1px;
          border-radius: 4px;
          padding: 3px 5px;
          font-size: var(--font-size-normal);
        }
        input[type="disabled"] {
          background: var(--highlight-blur):
          color: var(--border);
        }
        input[valid] {
          background: var(--gradient-end);
          color: var(--text);
        }
        input[hidden] {
          display: none;
        }
      `}</style>
    </input>
  );
};

export default TextInput;
