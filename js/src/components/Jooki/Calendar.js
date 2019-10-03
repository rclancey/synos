import React, { useState, useEffect, useMemo } from 'react';
import { PlaylistMenu } from './PlaylistMenu';
import { useTheme } from '../../lib/theme';

const zeroPad = (v, n) => {
  let s = '' + v;
  while (s.length < n) {
    s = '0' + s;
  }
  return s;
};

const ScheduleRow = ({
  dow,
  className,
  icon,
  time,
  override,
  setTime,
  setOverride,
}) => {
  let hour, minute;
  if (override) {
    const dt = new Date(override);
    hour = dt.getHours();
    minute = dt.getMinutes();
    if (dow === 0) {
      if (dt.getDay() === 6) {
        hour -= 24;
      } else if (dt.getDay() === 1) {
        hour += 24;
      }
    } else if (dow === 6) {
      if (dt.getDay() === 0) {
        hour += 24;
      } else if (dt.getDay() === 5) {
        hour -= 24;
      }
    } else {
      if (dt.getDay() < dow) {
        hour -= 24;
      } else if (dt.getDay() > dow) {
        hour += 24;
      }
    }
  } else {
    hour = Math.floor(time / 3600000);
    minute = Math.round(((86400000 + time) % 3600000) / 60000);
  }
  return (
    <div className={`${className} ${hour < 0 ? 'under' : hour > 23 ? 'over' : ''}`}>
      <div className={`icon fas fa-${icon}`} />
      <div className="hour">
        { hour < 0 ? '-' : hour > 23 ? '+' : '' }
        {(hour + 24) % 24}
      </div>
      <div className="minute">:{zeroPad(minute, 2)}</div>
      <div className="arrows">
        <div className="fas fa-sort-up" onClick={() => {
          if (override) {
            setOverride(override + 15 * 60000);
          } else {
            setTime(time + 15 * 60000);
          }
        }} />
        <div className="fas fa-sort-down" onClick={() => {
          if (override) {
            setOverride(override - 15 * 60000);
          } else {
            setTime(time - 15 * 60000);
          }
        }} />
      </div>
      { override ? (
        <div className="fas fa-history" onClick={() => {
          /*<div className="fas fa-times-circle">*/
          console.debug('clear override');
          setOverride(null);
        }} />
      ) : (
        <div className="fas fa-clock" onClick={() => {
        /*<div className="far fa-dot-circle">*/
          let now = Date.now();
          let dt = new Date(now);
          while (dt.getDay() !== dow) {
            let next = now + 86400000;
            let nextdt = new Date(next);
            if (nextdt.getTimezoneOffset() > dt.getTimezoneOffset()) {
              next += 3600000;
              nextdt = new Date(next);
            } else if (nextdt.getTimezoneOffset() < dt.getTimezoneOffset()) {
              next -= 3600000;
              nextdt = new Date(next);
            }
            now = next;
            dt = nextdt;
          }
          const t = Math.round(now / (15 * 60000)) * 15 * 60000 + 3600000;
          console.debug('override %o', t);
          setOverride(t);
        }} />
      ) }
      <style jsx>{`
        .sleep, .wake {
          display: flex;
          padding: 3px 8px;
        }
        .wake {
          color: #ffcc00;
        }
        .icon {
          flex: 1;
        }
        .hour {
          text-align: right;
          flex: 2;
        }
        .minute {
          flex: 1;
        }
        .arrows {
          display: flex;
          flex-direction: column;
          flex: 1 1;
          text-align: center;
        }
        .arrows>div {
          font-size: 14px;
          line-height: 14px;
        }
        .arrows .fa-sort-up {
          position: relative;
          height: 7px;
          overflow: hidden;
          top: 3px;
          z-index: 2;
        }
        .arrows .fa-sort-down {
          position: relative;
          top: -3px;
        }
        .fa-clock {
          flex: 1 1;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CalendarDay = ({
  wide,
  dow,
  wakeTime,
  sleepTime,
  wakeOverride,
  sleepOverride,
  wakePlaylist,
  playlists,
  setWakeTime,
  setWakeOverride,
  setSleepTime,
  setSleepOverride,
  setWakePlaylist,
}) => {
  const colors = useTheme();
  return (
    <div className="day">
      <div className="dayname">{weekdays[dow]}</div>
      <ScheduleRow
        className="sleep"
        icon="moon"
        dow={dow}
        time={sleepTime}
        override={sleepOverride}
        setTime={setSleepTime}
        setOverride={setSleepOverride}
      />
      <ScheduleRow
        className="wake"
        icon="sun"
        dow={dow}
        time={wakeTime}
        override={wakeOverride}
        setTime={setWakeTime}
        setOverride={setWakeOverride}
      />
      <PlaylistMenu
        playlists={playlists}
        selected={wakePlaylist}
        onChange={setWakePlaylist}
      />
      <style jsx>{`
        .day {
          display: flex;
          flex-direction: column;
          margin: .5em;
          border-style: solid;
          border-width: 1px;
          border-radius: 10px;
          overflow: hidden;
          max-width: calc(${wide ? '14.14' : '50'}% - 1em);
          box-sizing: border-box;
        }
        .day .dayname {
          background: ${colors.highlightText};
          color: ${colors.background};
          font-size: 20px;
          font-weight: 700;
          padding: 3px 8px;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export const Calendar = ({ wide = true }) => {
  const [cal, setCal] = useState([null, null, null, null, null, null, null]);
  const [playlists, setPlaylists] = useState([]);
  useEffect(() => {
    fetch('/api/cron', { method: 'GET' })
      .then(resp => resp.json())
      .then(setCal);
    fetch('/api/jooki/playlists', { method: 'GET' })
      .then(resp => resp.json())
      .then(pls => {
        pls.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        setPlaylists(pls);
      });
  }, []);
  const updateCal = (dow, k, update) => {
    const orig = cal[dow % 7];
    const v = {};
    v[k] = Object.assign({}, orig[k], update);
    const s = Object.assign({}, orig, v);
    const c = cal.slice(0);
    c[dow % 7] = s;
    setCal(c);
    fetch('/api/cron', {
      method: 'POST',
      body: JSON.stringify(c),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(resp => resp.json())
      .then(setCal);
  };
  useEffect(() => {
    console.debug('calendar playlists changed');
  }, [playlists]);
  useEffect(() => {
    console.debug('calendar data changed');
  }, [cal]);
  useEffect(() => {
    console.debug('calendar wide changed');
  }, [wide]);
  const dow = new Date().getDay();
  const days = useMemo(() => {
    return [dow, dow + 1, dow + 2, dow + 3, dow + 4, dow + 5, dow + 6];
  }, [dow]);
  const sched = useMemo(() => {
    return days.map(dow => !!cal[dow % 7] ? Object.assign({}, cal[dow % 7], { dow: dow % 7 }) : null);
  }, [days, cal]);
  console.debug('calendar: %o', { cal, dow, days, sched });
  return (
    <div className="calendar">
      { sched.map(day => !!day ? (
        <CalendarDay
          key={day.dow}
          wide={wide}
          playlists={playlists}
          dow={day.dow}
          wakeTime={day.wake.time}
          wakeOverride={day.wake.override}
          wakePlaylist={day.wake.playlist}
          sleepTime={day.sleep.time}
          sleepOverride={day.sleep.override}
          setWakeTime={t => updateCal(day.dow, 'wake', { time: t })}
          setWakeOverride={t => updateCal(day.dow, 'wake', { override: t })}
          setSleepTime={t => updateCal(day.dow, 'sleep', { time: t })}
          setSleepOverride={t => updateCal(day.dow, 'sleep', { override: t })}
          setWakePlaylist={id => updateCal(day.dow, 'wake', { playlist_id: id })}
        />
      ) : null) }
      <style jsx>{`
        .calendar {
          display: flex;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
};

