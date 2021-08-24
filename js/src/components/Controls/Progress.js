import React, { useCallback, useMemo } from 'react';
import _JSXStyle from "styled-jsx/style";

export const Progress = ({ currentTime, duration, onSeekTo, height = 4, ...props }) => {
  const seekTo = useCallback((evt) => {
    let l = 0;
    let node = evt.target;
    while (node !== null && node !== undefined) {
      l += node.offsetLeft;
      node = node.offsetParent;
    }
    const x = evt.pageX - l;
    const w = evt.target.offsetWidth;
    const t = duration * x / w;
    onSeekTo(t);
  }, [duration, onSeekTo]);
  const style = useMemo(() => {
    const pct = duration > 0 ? 100 * currentTime / duration : 0;
    return { width: `${pct}%` };
  }, [duration, currentTime]);
  return (
    <div className="progressContainer" onClick={seekTo} {...props}>
      <div className="progress" style={style} />
      <style jsx>{`
        .progressContainer {
          min-height: ${height}px;
          max-height: ${height}px;
          height: ${height}px;
          background-color: #ccc;
        }
        .progress {
          height: ${height}px;
          background-color: #666;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default Progress;
