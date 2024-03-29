import React, { useState, useEffect, useMemo, useRef } from 'react';
import _JSXStyle from "styled-jsx/style";

import { useJooki } from '../../lib/jooki';
import { PlaylistMenu } from './PlaylistMenu';

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
  updateCal,
}) => {
  const setWakeTime = useMemo(() => {
    return t => updateCal(dow, 'wake', { time: t });
  }, [dow, updateCal]);
  const setWakeOverride = useMemo(() => {
    return t => updateCal(dow, 'wake', { override: 1 });
  }, [dow, updateCal]);
  const setSleepTime = useMemo(() => {
    return t => updateCal(dow, 'sleep', { time: t });
  }, [dow, updateCal]);
  const setSleepOverride = useMemo(() => {
    return t => updateCal(dow, 'sleep', { override: t });
  }, [dow, updateCal]);
  const setWakePlaylist = useMemo(() => {
    return id => updateCal(dow, 'wake', { playlist_id: id });
  }, [dow, updateCal]);
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
          background: var(--highlight);
          color: var(--inverse);
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
  const { playlists } = useJooki();
  //const [playlists, setPlaylists] = useState([]);
  const days = useRef([0, 1, 2, 3, 4, 5, 6]);
  useEffect(() => {
    fetch('/api/cron', { method: 'GET' })
      .then(resp => resp.json())
      .then(setCal);
    /*
    fetch('/api/jooki/playlists', { method: 'GET' })
      .then(resp => resp.json())
      .then(pls => {
        pls.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
        setPlaylists(pls);
      });
    */
    const dow = new Date().getDay();
    days.current = [dow, dow + 1, dow + 2, dow + 3, dow + 4, dow + 5, dow + 6];
  }, []);
  const updateCal = useMemo(() => {
    return (dow, k, update) => {
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
  }, [cal, setCal]);
  const sched = useMemo(() => {
    return days.current.map(dow => !!cal[dow % 7] ? Object.assign({}, cal[dow % 7], { dow: dow % 7 }) : null);
  }, [cal]);
  return (
    <div className="calendar">
      { sched.map(day => !!day ? (
        <CalendarDay
          key={day.dow}
          wide={wide}
          playlists={playlists}
          dow={day.dow}
          wakeTime={day.wake ? day.wake.time : null}
          wakeOverride={day.wake ? day.wake.override : null}
          wakePlaylist={day.wake ? day.wake.playlist : null}
          sleepTime={day.sleep ? day.sleep.time : null}
          sleepOverride={day.sleep ? day.sleep.override : null}
          updateCal={updateCal}
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

