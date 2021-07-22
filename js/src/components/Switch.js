import React from 'react';
import _JSXStyle from "styled-jsx/style";

export const Switch = ({ on, onToggle }) => {
  return (
    <div className={`switch ${on ? 'on' : 'off'}`} onClick={() => onToggle(!on)}>
      <div className="onbg">
        <div className="knob" />
      </div>
      <style jsx>{`
        .switch {
          width: 35px;
          min-width: 35px;
          max-width: 35px;
          height: 20px;
          border-style: solid;
          border-width: 2px;
          border-radius: 20px;
          overflow: hidden;
          border-color: rgba(127, 127, 127, 0.4);
          transition: border-color 0.25s;
        }
        .switch.on {
          border-color: var(--higlight-muted);
        }
        .switch .onbg {
          width: 20px;
          height: 20px;
          border: solid transparent 0px;
          border-radius: 10px;
          padding-left: 0px;
          background-color: var(--highlight);
          transition: padding-left 0.25s;
        }
        .switch.on .onbg {
          padding-left: 15px;
        }
        .switch .knob {
          width: 18px;
          height: 18px;
          border: solid transparent 1px;
          border-radius: 10px;
          overflow: hidden;
          background-color: white;
          box-shadow: 0px 0px 0px 1px var(--highlight-muted);
        }
      `}</style>
    </div>
  );
};
