import { useState, useEffect } from 'react';
import { useMeasure } from './useMeasure';

const constrained = (col) => {
  if (col.minWidth) {
    if (col.width === col.minWidth) {
      return true;
    }
  } else if (col.width === 10) {
    return true;
  }
  if (col.maxWidth && col.width === col.maxWidth) {
    return true;
  }
  return false;
};

const constrain = (col, width) => {
  let w = width;
  if (col.minWidth) {
    if (w < col.minWidth) {
      w = col.minWidth;
    }
  } else if (w < 10) {
    w = 10;
  }
  if (col.maxWidth && w > col.maxWidth) {
    return col.maxWidth;
  }
  return Math.floor(w);
};

const total = (cols) => {
  return cols.reduce((acc, col) => acc + col.width, 0);
};

export const useColumns = (cols) => {
  const [width, , setNode] = useMeasure(1, 1);
  const [columns, setColumns] = useState(cols);
  useEffect(() => {
    const sum = total(cols) || 1;
    let resized = cols.map(col => Object.assign({}, col, { width: constrain(col, col.width * width / sum) }));
    while (true) {
      const sum = total(resized);
      if (sum === 0 || sum === width) {
        break;
      }
      const usum = resized.reduce((acc, col) => acc + (constrained(col) ? 0 : col.width), 0);
      if (usum === 0) {
        break;
      }
      const csum = sum - usum;
      resized = resized.map(col => Object.assign({}, col, { width: constrain(col, col.width * (width - csum) / usum) }));
      if (sum === total(resized)) {
        for (let i = 0; i < resized.length; i++) {
          const t = total(resized);
          if (t === width) {
            break;
          }
          resized[i].width = constrain(resized[i], resized[i].width + width - t);
        }
        break;
      }
    }
    setColumns(resized);
  }, [width, cols]);
  const onResize = (key, deltaW) => {
    const idx = columns.findIndex(col => col.key === key);
    if (idx === -1) {
      return;
    }
    const cols = columns.slice();
    const w = constrain(cols[idx], cols[idx].width + deltaW);
    let dw = w - cols[idx].width;
    cols[idx] = Object.assign({}, cols[idx], { width: w });
    const n = cols.length - 1;
    if (cols[n].key === null) {
      // last column is padding
      const w = constrain(cols[n], cols[n].width - dw);
      dw -= (cols[n].width - w);
      cols[n] = Object.assign({}, cols[n], { width: w });
    }
    for (let i = idx + 1; i < cols.length && dw !== 0; i++) {
      const w = constrain(cols[i], cols[i].width - dw);
      dw -= (cols[i].width - w);
      cols[i] = Object.assign({}, cols[i], { width: w });
    }
    for (let i = idx - 1; i >= 0 && dw !== 0; i--) {
      const w = constrain(cols[i], cols[i].width - dw);
      dw -= (cols[i].width - w);
      cols[i] = Object.assign({}, cols[i], { width: w });
    }
    setColumns(cols);
  };
  return [
    columns,
    onResize,
    setNode,
  ];
};
