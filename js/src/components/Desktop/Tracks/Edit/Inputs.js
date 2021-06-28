import React, { useState, useCallback } from 'react';
import { useTheme } from '../../../../lib/theme';
import { isoDate, fromIsoDate, formatTime } from './util';

export const TextInput = ({
  track,
  field,
  onChange,
}) => {
  return (
    <input
      type="text"
      size={50}
      value={track[field] || ''}
      onChange={evt => onChange({ [field]: evt.target.value || null })}
    />
  );
};

export const IntegerInput = ({
  track,
  field,
  min,
  max,
  step = 1,
  onChange,
}) => {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={track[field] || ''}
      onChange={evt => {
        const v = parseInt(evt.target.value);
        const n = Number.isNaN(v) ? null : v;
        return onChange({ [field]: n });
      }}
    />
  );
};


export const DateInput = ({
  track,
  field,
  onChange,
}) => {
  return (
    <input
      type="date"
      value={isoDate(track[field]) || ''}
      style={{fontFamily: 'inherit'}}
      onChange={evt => onChange({ [field]: fromIsoDate(evt.target.value) })}
    />
  );
};

export const StarInput = ({
  track,
  field,
  onChange,
}) => {
  const colors = useTheme();
  const filled = Math.min(5, Math.round((track[field] || 0) / 20));
  const stars = new Array(5);
  stars.fill(1, 0, filled);
  stars.fill(0, filled);
  return (
    <div className="stars">
      { stars.map((f, i) => (
        <span key={i} onClick={() => onChange({ [field]: (i+1)*20 })}>{f ? '\u2605' : '\u2606'}</span>
      )) }
      <style jsx>{`
        .stars {
          color: ${colors.highlightText};
          display: inline-block;
        }
        .stars span {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export const BooleanInput = ({ track, field, children, onChange }) => {
  return (
    <>
      <input
        type="checkbox"
        value="true"
        checked={!!track[field]}
        onChange={evt => onChange({ [field]: evt.target.checked })}
      />
      {' '}
      {children}
    </>
  );
};

export const GenreInput = ({ track, genres, onChange }) => {
  const [listid,] = useState('genreList' + Math.random());
  return (
    <>
      <input
        type="text"
        value={track.genre || ''}
        list={listid}
        onChange={evt => onChange({ genre: evt.target.value || null })}
      />
      <datalist id={listid}>
        {genres.map(genre => <option key={genre} value={genre} />)}
      </datalist>
    </>
  );
};

export const TimeInput = ({
  value,
  max,
  placeholder,
  onChange,
  ...props
}) => {
  const onChangeParsed = evt => {
    if (!evt.target.value) {
      onChange(null);
    } else {
      const t = parseFloat(evt.target.value);
      if (Number.isNaN(t)) {
        onChange(null);
      } else {
        onChange(Math.round(t * 1000));
      }
      /*
      const parts = evt.target.value.split(':');
      let t = 0;
      const sec = parseFloat(parts.pop());
      const min = parseInt(parts.pop());
      const hr = parseInt(parts.pop());
      if (sec && !Number.isNaN(sec)) {
        t += Math.floor(1000 * sec);
      }
      if (min && !Number.isNaN(min)) {
        t += 60000 * min;
      }
      if (hr && !Number.isNaN(hr)) {
        t += 3600000 * hr;
      }
      onChange(t);
      */
    }
  };
  return (
    <input type="number" min={0} max={formatTime(max)} step={0.001} value={formatTime(value) || ''} placeholder={formatTime(placeholder)} onChange={onChangeParsed} {...props} />
  );
};

export const RangeInput = ({
  value = 0,
  onChange,
}) => {
  const colors = useTheme();
  return (
    <div className="range">
      <input
        type="range"
        min={-255}
        max={255}
        step={1}
        value={value || 0}
        onChange={evt => {
          const v = parseInt(evt.target.value);
          if (Number.isNaN(v) || Math.abs(v) < 5) {
            onChange(null);
          } else {
            onChange(v);
          }
        }}
      />
      <div className="ticks">
        <div style={{left: '0%'}} />
        <div style={{left: '10%'}} />
        <div style={{left: '20%'}} />
        <div style={{left: '30%'}} />
        <div style={{left: '40%'}} />
        <div style={{left: '50%'}} />
        <div style={{left: '60%'}} />
        <div style={{left: '70%'}} />
        <div style={{left: '80%'}} />
        <div style={{left: '90%'}} />
        <div style={{left: '100%'}} />
      </div>
      <div className="labels">
        <div>-100%</div>
        <div style={{textAlign: 'center'}}>None</div>
        <div style={{textAlign: 'right'}}>+100%</div>
      </div>
      <style jsx>{`
        .range {
          min-width: 256px;
          width: calc(100% - 16px);
          display: inline-block;
        }
        .range input[type="range"] {
          display: block;
          width: 100%;
          margin-left: -2px !important;
          margin-bottom: -8px !important;
        }
        .range .ticks {
          width: 100%;
          line-height: 5px;
        }
        .range .ticks div {
          display: inline-block;
          position: relative;
          width: 1px;
          height: 5px;
          margin-right: -1px;
          background-color: ${colors.text};
        }
        .range .labels {
          width: 100%;
        }
        .range .labels div {
          width: 33.33%;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export const Updated = ({
  updated,
  field,
  fields,
  onReset,
}) => {
  const onClick = useCallback(() => {
    if (!onReset) {
      return;
    }
    if (fields && fields.length) {
      onReset(fields);
    }
    onReset([field]);
  }, [field, fields, onReset]);
  if (!updated) {
    return <div style={{width: '16px', display: 'inline-block'}} />;
  }
  if (fields && fields.length > 0) {
    if (!fields.some(f => updated[f])) {
      return <div style={{width: '16px', display: 'inline-block'}} />;
    }
  } else if (!updated[field]) {
    return <div style={{width: '16px', display: 'inline-block'}} />;
  }
  return (
    <div className="updated" onClick={onClick}>
      {'\u2713'}
      <style jsx>{`
        div.updated {
          display: inline-block;
          cursor: pointer;
          border-radius: 50%;
          background-color: #0c0;
          color: white;
          font-weight: bold;
          width: 14px;
          height: 14px;
          line-height: 14px;
          text-align: center;
          margin-left: 2px;
        }
      `}</style>
    </div>
  );
};
