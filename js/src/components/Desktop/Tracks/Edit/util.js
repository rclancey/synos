export const isoDate = t => {
  if (t === null || t === undefined) {
    return null;
  }
  const d = new Date(t);
  const opts = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  };
  return Intl.DateTimeFormat('en-CA', opts).format(d);
};

export const fromIsoDate = dtstr => {
  if (!dtstr) {
    return null;
  }
  const d = new Date(dtstr + 'T00:00:00Z');
  return d.getTime();
};

export const startOfDay = t => {
  const d = new Date(t);
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

export const formatRelDate = (t) => {
  const d = new Date(t);
  const now = Date.now();
  const tomorrow = startOfDay(now);
  const today = startOfDay(now);
  const yesterday = startOfDay(now);
  const lastweek = startOfDay(now);
  const thisyear = startOfDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  yesterday.setDate(yesterday.getDate() - 1);
  lastweek.setDate(lastweek.getDate() - 6);
  thisyear.setMonth(0);
  thisyear.setDate(1);
  const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes().toString();
  const p = d.getHours() < 12 ? 'AM' : 'PM';
  if (d >= today && d < tomorrow) {
    return `Today at ${h}:${m} ${p}`;
  }
  if (d >= yesterday && d < today) {
    return `Yesterday at ${h}:${m} ${p}`;
  }
  if (d >= lastweek && d < today) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[d.getDay()]} at ${h}:${m} ${p}`;
  }
  return formatDate(t);
  /*
  if (d >= thisyear && d < today) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getDate()} at ${h}:${m} ${p}`;
  }
  return 
  */
};

export const formatTime = t => {
  if (t === null || t === undefined) {
    return null;
  }
  return (t / 1000).toFixed(3);
  /*
  const hr = Math.floor(t / 3600000);
  const min = Math.floor((t % 3600000) / 60000);
  const sec = (t % 60000) / 1000;
  if (hr > 0) {
    return `${hr}:${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec.toFixed(3)}`;
  }
  return `${min}:${sec < 10 ? '0' : ''}${sec.toFixed(3)}`;
  */
};

export const formatDuration = t => {
  if (t === null || t === undefined) {
    return '0:00.000';
  }
  const hr = Math.floor(t / 3600000);
  const min = Math.floor((t % 3600000) / 60000);
  const sec = (t % 60000) / 1000;
  if (hr > 0) {
    return `${hr}:${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec.toFixed(3)}`;
  }
  return `${min}:${sec < 10 ? '0' : ''}${sec.toFixed(3)}`;
};

export const formatSize = s => {
  if (s === null || s === undefined) {
    return '0 bytes';
  }
  if (s >= 10 * 1024 * 1024 * 1024) {
    return `${Math.round(s / (1024 * 1024 * 1024))} GB`;
  }
  if (s >= 1024 * 1024 * 1024) {
    return `${(s / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (s >= 10 * 1024 * 1024) {
    return `${Math.round(s / (1024 * 1024))} MB`;
  }
  if (s >= 1024 * 1024) {
    return `${(s / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (s >= 10 * 1024) {
    return `${Math.round(s / (1024))} kB`;
  }
  if (s >= 1024) {
    return `${(s / 1024).toFixed(1)} kB`;
  }
  return `${s} bytes`;
};

export const formatDate = t => {
  const d = new Date(t);
  const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes().toString();
  const p = d.getHours() < 12 ? 'AM' : 'PM';
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getYear() % 100} ${h}:${m} ${p}`;
};
