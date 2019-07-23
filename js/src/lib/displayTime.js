export const displayTime = (t) => {
  if (t) {
    const sign = t < 0 ? -1 : 1;
    const h = Math.floor(sign * t / 3600000);
    const m = Math.floor(((sign * t) % 3600000) / 60000);
    const s = Math.floor(((sign * t) % 60000) / 1000);
    let d = '';
    if (sign === -1) {
      d += '-';
    }
    if (h > 0) {
      d += `${h}:`;
      if (m >= 10) {
        d += `${m}:`;
      } else {
        d += `0${m}:`;
      }
    } else {
      d += `${m}:`;
    }
    if (s >= 10) {
      d += `${s}`;
    } else {
      d += `0${s}`;
    }
    return d;
  }
  return '0:00';
};


export default displayTime;

