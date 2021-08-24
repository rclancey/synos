import React, { useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

export const ColorInput = ({ value, placeholder = '#000000', onInput }) => {
  const myOnInput = useCallback((evt) => onInput(evt.target.value), [onInput]);
  if (!onInput) {
    return (
      <div className="color">
        <style jsx>{`
          .color {
            display: inline-block;
            width: 2em;
            height: 1em;
            border: solid var(--border) 1px;
            border-radius: 4px;
            background-color: ${value || '#000'};
          }
        `}</style>
      </div>
    );
  }
  return <TextInput value={value} placeholder={placeholder} onInput={myOnInput} {...props} />;
};

export default ColorInput;
