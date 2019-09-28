import React, { useState } from 'react';

export const RingMenu = ({
  value,
  options,
  onChange,
}) => {
  const h = 16;
  const [open, setOpen] = useState(false);
  const [optPos, setOptPos] = useState(0);

  const beginTouch = evt => {
    const touchStartY = evt.touches[0].clientY;
    const scrollStartY = optPos;
    setOpen(true);
    const onDrag = (evt) => {
      const dy = evt.touches[0].clientY - touchStartY;
      setOptPos(scrollStartY + dy);
    };
    const onEnd = (evt) => {
      document.removeEventListener("ontouchmove", onDrag);
      document.removeEventListener("ontouchend", onEnd);
      setOpen(false);
      let idx = options.findIndex(opt => opt.value === value);
      idx += Math.round(optPos / h);
      idx = idx % options.length;
      onChange(options[idx].value);
    };
    document.addEventListener("ontouchmove", onDrag);
    document.addEventListener("ontouchend", onEnd);
  };
  if (!open) {
    return (
      <div className="ringmenu" onTouchStart={beginTouch}>
        {options.find(opt => opt.value === value).text}
      </div>
    );
  }
  return (
    <div className="ringmenu">
      <div className="options">
        { options.map((opt, i) => (
          <div key={`0-${i}`} className="option">{opt.text}</div>
        )) }
        { options.map((opt, i) => (
          <div key={`1-${i}`} className="option">{opt.text}</div>
        )) }
        { options.map((opt, i) => (
          <div key={`2-${i}`} className="option">{opt.text}</div>
        )) }
      </div>
      <style jsx>{`
        .ringmenu {
          position: relative;
          top: ${-h}px;
          height: ${h*3}px;
          overflow: hidden;
        }
        .ringmenu .options {
          position: relative;
          top: ${h * (options.findIndex(opt => opt.value === value) + 1)}px;
        }
        .ringmenu .options .option {
        }
      `}</style>
    </div>
  );
};
