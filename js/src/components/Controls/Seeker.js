import React, { useRef, useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";

import Triangle from './Triangle';

const root3 = Math.sqrt(3);

export const Seeker = ({
  size = 15,
  fwd = true,
  onSeek,
  onSkip,
}) => {
  const seeking = useRef(false);
  const interval = useRef(null);
  const div = useRef(null);
  const beginSeek = useMemo(() => {
    return (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (seeking.current) {
        return false;
      }
      if (interval.current !== null) {
        clearInterval(interval.current);
        interval.current = null;
      }
      if (evt.type === 'mousedown') {
        document.addEventListener('mouseup', () => seeking.current = false, { once: true });
      } else if (evt.type === 'touchstart') {
        document.addEventListener('touchend', () => seeking.current = false, { once: true });
      }
      seeking.current = true;
      const startTime = Date.now();
      interval.current = setInterval(() => {
        const t = Date.now() - startTime;
        if (seeking.current) {
          if (t >= 250) {
            onSeek(fwd ? 200 : -200);
          }
        } else {
          clearInterval(interval.current);
          if (t < 250) {
            onSkip(fwd ? 1 : -1);
          }
        }
      }, 40);
    };
  }, [seeking, interval, onSeek, onSkip, fwd]);
  return (
    <div 
      className="seeker"
      ref={div}
      onMouseDown={beginSeek}
      onTouchStart={beginSeek}
    > 
      <div className="padding" />
      <div className="triangles">
        <Triangle orientation={fwd ? "right" : "left"} size={size} />
        <Triangle orientation={fwd ? "right" : "left"} size={size} />
      </div>
      <div className="padding" />
      <style jsx>{`
        .seeker {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .padding {
          flex: 2;
          max-height: ${0.5 * size / root3}px;
        }
        .triangles {
          flex: 1;
          display: flex;
          flex-direction: row;
        }
      `}</style>
    </div>
  );
};

export default Seeker;
