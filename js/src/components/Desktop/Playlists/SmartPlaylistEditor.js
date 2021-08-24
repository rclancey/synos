import React, { useState, useEffect, useMemo, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import Button from '../../Input/Button';
import MenuInput from '../../Input/MenuInput';
import TextInput from '../../Input/TextInput';
import DateInput from '../../Input/DateInput';
import TimeInput from '../../Input/TimeInput';
import IntegerInput from '../../Input/IntegerInput';
import StarInput from '../../Input/StarInput';
//import DurationInput from '../../Input/DurationInput';

const newRule = () => {
  return {
    type: 'string',
    ruleset: null,
    field: 'artist',
    sign: 'STRPOS',
    op: 'CONTAINS',
    strings: [''],
    ints: [0, 0, 0],
    times: [0, 0, 0],
    bool: null,
    media_kind: null,
    playlist: null,
  };
};

const newRuleSetRule = () => {
  return {
    type: 'ruleset',
    ruleset: newRuleSet(),
    field: null,
    sign: 'POS',
    op: 'IS',
    strings: [''],
    ints: [0, 0, 0],
    times: [0, 0, 0],
    bool: null,
    media_kind: null,
    playlist: null,
  };
};

const newRuleSet = () => {
  return {
    conjuction: 'AND',
    rules: [newRule()],
  };
};

const conjunctionOptions = [
  { value: 'AND', label: 'all' },
  { value: 'OR', label: 'any' },
];

const ConjunctionMenu = ({
  value,
  onChange,
}) => {
  const myOnChange = useCallback((opt) => onChange(opt.value), [onChange]);
  return (
    <>
      {'Match\u00a0 '}
      <MenuInput value={value} options={conjunctionOptions} onChange={myOnChange} />
    </>
  );
};

const replaceRule = (rules, i, rule) => {
  const before = rules.slice(0, i);
  const after = rules.slice(i + 1);
  return before.concat([rule]).concat(after);
};

const insertRule = (rules, i, rule) => {
  const before = rules.slice(0, i + 1);
  const after = rules.slice(i + 1);
  return before.concat([rule]).concat(after);
};

const removeRule = (rules, i) => {
  const before = rules.slice(0, i);
  const after = rules.slice(i + 1);
  return before.concat(after);
};

export const SmartPlaylistRuleSet = ({
  ruleset,
  depth,
  onChange,
  onAddRule,
  onDeleteRule,
}) => {
  return (
    <>
      <div className="ruleset">
        <ConjunctionMenu
          value={ruleset.conjunction}
          onChange={conjunction => onChange(Object.assign({}, ruleset, { conjunction }))}
        />
        { depth > 0 ? (
          <PlusMinus
            onAdd={() => onAddRule(newRule())}
            onDelete={onDeleteRule}
            onAddSub={() => onAddRule(newRuleSetRule())}
          />
        ) : null }
        <style jsx>{`
          .ruleset {
            display: flex;
            flex-direction: row;
            align-items: baseline;
            margin-left: ${depth}em;
            border-bottom: solid var(--border) 1px;
            padding-bottom: 4px;
            margin-top: 4px;
            font-size: 12px;
            line-height: 17px;
          }
        `}</style>
      </div>
      { ruleset.rules.map((rule, i) => (
        <SmartPlaylistRule
          key={i}
          rule={rule}
          depth={depth + 1}
          onChange={xrule => {
            onChange(Object.assign({}, ruleset, { rules: replaceRule(ruleset.rules, i, xrule) }));
          }}
          onAddRule={xrule => {
            onChange(Object.assign({}, ruleset, { rules: insertRule(ruleset.rules, i, xrule) }));
          }}
          onDeleteRule={() => {
            onChange(Object.assign({}, ruleset, { rules: removeRule(ruleset.rules, i) }));
          }}
        />
      )) }
    </>
  );
};

export const PlusMinus = ({
  onAdd,
  onDelete,
}) => {
  return (
    <div className="plusminus">
      <div className="padding" />
      <div className="content">
        <Button type="secondary" onClick={onDelete}>{'\u2212'}</Button>
        <Button type="secondary" onClick={() => onAdd(newRule)}>+</Button>
        <Button type="secondary" onClick={() => onAdd(newRuleSetRule())}>{'\u21b3'}</Button>
        {/*
        <span onClick={onDelete}>{'\u2212'}</span>
        <span onClick={() => onAdd(newRule)}>+</span>
        <span className="ruleset" onClick={() => onAdd(newRuleSetRule())}>{'\u21b3'}</span>
        */}
        {/*
        <span className="fas fa-minus-circle" onClick={onDelete}>{'\u2212'}</span>
        <span className="fas fa-plus-circle" onClick={() => onAdd(newRule)}>+</span>
        <span className="fas fa-arrow-alt-circle-right" onClick={() => onAdd(newRuleSetRule())}>{'\u21aa'}</span>
        */}
      </div>
      <style jsx>{`
        .plusminus {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          flex: 2;
          text-align: right;
          margin-left: 8px;
        }
        .plusminus .padding {
          flex: 20;
        }
        .plusminus .content {
          flex: 1;
          display: flex;
          white-space: nowrap;
          color: var(--text);
        }
        .plusminus .content span {
          margin-left: 2px;
          line-height: 14px;
          display: block;
          border: solid var(--border) 1px;
          border-radius: 6px;
          width: 16px;
          height: 16px;
          overflow: hidden;
          text-align: center;
          font-size: 16px;
        }
        .plusminus .content span.ruleset {
          line-height: 21px;
        }
        /*
        .plusminus div {
          border: solid black 1px;
          border-radius: 4px;
          width: 18px;
          height: 18px;
          text-align: center;
          line-height: 18px;
          margin-left: 2px;
          color: black;
        }
        */
      `}</style>
    </div>
  );
};

const fields = {
  'album': { name: 'Album', type: 'string' },
  'album_artist': { name: 'Album Artist', type: 'string' },
  'album_rating': { name: 'Album Rating', type: 'star' },
  'artist': { name: 'Artist', type: 'string' },
  'bpm': { name: 'BPM', type: 'int', max: 9999 },
  'bitrate': { name: 'Bit Rate', type: 'int', unit: 'kbps', multiplier: 1024 },
  'comments': { name: 'Comments', type: 'string' },
  'compilation': { name: 'Compilation', type: 'boolean' },
  'composer': { name: 'Composer', type: 'string' },
  'date_added': { name: 'Date Added', type: 'date' },
  'date_modified': { name: 'Date Modified', type: 'date' },
  'disk_number': { name: 'Disk Number', type: 'int', max: 99 },
  'genre': { name: 'Genre', type: 'string' },
  'grouping': { name: 'Grouping', type: 'string' },
  'kind': { name: 'Kind', type: 'string' },
  'play_date': { name: 'Last Played', type: 'date' },
  'skip_date': { name: 'Last Skipped', type: 'date' },
  'loved': { name: 'Loved', type: 'love' },
  'media_kind': { name: 'Media Kind', type: 'mediakind' },
  'name': { name: 'Name', type: 'string' },
  'playlist_persistent_id': { name: 'Playlist', type: 'playlist' },
  'play_count': { name: 'Plays', type: 'int', max: 999999 },
  'purchased': { name: 'Purchased', type: 'boolean' },
  'rating': { name: 'Rating', type: 'star', unit: 'stars', multiplier: 20, max: 5 },
  'sample_rate': { name: 'Sample Rate', type: 'int', unit: 'Hz', max: 999999 },
  'size': { name: 'Size', type: 'int', unit: 'MB', multiplier: 1024 * 1024, max: 9999 },
  'skip_count': { name: 'Skips', type: 'int', max: 999999 },
  'sort_album': { name: 'Sort Album', type: 'string' },
  'sort_album_artist': { name: 'Sort Album Artist', type: 'string' },
  'sort_composer': { name: 'Sort Composer', type: 'string' },
  'sort_name': { name: 'Sort Name', type: 'string' },
  'total_time': { name: 'Time', type: 'time' },
  'track_number': { name: 'Track Number', type: 'int', max: 99 },
  'year': { name: 'Year', type: 'int', max: 9999 },
};

export const FieldMenu = ({
  value,
  onChange,
}) => {
  const options = useMemo(() => Object.entries(fields)
    .sort((a, b) => a.name < b.name ? -1 : 1)
    .map(([value, label]) => ({ value, label: label.name })), []);
  const myOnChange = useCallback((opt) => onChange(opt.value, fields[opt.value].type), [onChange]);
  return (
    <MenuInput value={value} options={options} onChange={myOnChange} />
  );
};

export const DurationMenu = ({
  value,
  onChange,
}) => {
  const opts = [
    { label: 'months', value: 30 * 24 * 60 * 60 * 1000 },
    { label: 'weeks', value: 7 * 24 * 60 * 60 * 1000 },
    { label: 'days', value: 24 * 60 * 60 * 1000 },
    { label: 'hours', value: 60 * 60 * 1000 },
    { label: 'minutes', value: 60 * 1000 },
    { label: 'seconds', value: 1000 },
    { label: 'milliseconds', value: 1 },
  ];
  const myOnChange = useCallback((opt) => onChange(opt.value), [onChange]);
  return (
    <MenuInput value={value} options={opts} onChange={myOnChange} />
  );
};

export const OpMenu = ({
  ops,
  op,
  sign,
  onChange,
}) => {
  let idx = ops.findIndex(x => x.op === op && x.sign === sign);
  if (idx < 0) {
    idx = 0;
  }
  return (
    <MenuInput value={ops[idx].value} options={ops} onChange={onChange} />
  );
  return (
    <select value={idx} onChange={evt => onChange(ops[evt.target.selectedIndex])}>
      { ops.map((op, i) => (<option key={i} value={i}>{op.name}</option>)) }
    </select>
  );
};

export const SmartPlaylistStringRule = ({
  strings = [''],
  onUpdate,
}) => {
  const myOnChange = useCallback((val) => onUpdate({ strings: [val].concat(strings.slice(1)) }), [strings, onUpdate]);
  return (
    <TextInput value={strings[0]} onInput={myOnChange} />
  );
};

export const SmartPlaylistIntRule = ({
  field,
  op,
  ints = [0, 0],
  depth,
  onUpdate,
}) => {
  const onChangeOne = useCallback((val) => onUpdate({ ints: [val].concat(ints.slice(1)) }), [ints, onUpdate]);
  const onChangeTwo = useCallback((val) => onUpdate({ ints: ints.slice(0, 1).concat([val]).concat(ints.slice(2)) }), [ints, onUpdate]);
  return (
    <>
      <IntegerInput value={ints[0]} min={0} max={999999} onInput={onChangeOne} />
      { op === 'BETWEEN' ? (
        <>
          {'\u00a0 to \u00a0'}
          <IntegerInput value={ints[1]} min={ints[0]} max={999999} onInput={onChangeTwo} />
        </>
      ) : null }
      { fields[field].unit }
    </>
  );
};

export const SmartPlaylistRatingRule = ({
  field,
  op,
  ints = [0, 0],
  depth,
  onUpdate,
}) => {
  const onChangeOne = useCallback((val) => onUpdate({ ints: [val * 20].concat(ints.slice(1)) }), [ints, onUpdate]);
  const onChangeTwo = useCallback((val) => onUpdate({ ints: ints.slice(0, 1).concat([val * 20]).concat(ints.slice(2)) }), [ints, onUpdate]);
  return (
    <>
      <StarInput value={ints[0] / 20} max={5} onInput={onChangeOne} />
      { op === 'BETWEEN' ? (
        <>
          {'\u00a0 to \u00a0'}
          <StarInput value={ints[1] / 20} min={ints[0] / 20} max={5} onInput={onChangeTwo} />
        </>
      ) : null }
    </>
  );
};

export const SmartPlaylistTimeRule = ({
  field,
  op,
  ints = [0, 0],
  depth,
  onUpdate,
}) => {
  const onChangeOne = useCallback((val) => onUpdate({ ints: [val / 60].concat(ints.slice(1)) }), [ints, onUpdate]);
  const onChangeTwo = useCallback((val) => onUpdate({ ints: ints.slice(0, 1).concat([val / 60]).concat(ints.slice(2)) }), [ints, onUpdate]);
  return (
    <>
      <TimeInput value={ints[0]} onInput={onChangeOne} />
      { op === 'BETWEEN' ? (
        <>
          {'\u00a0 to \u00a0'}
          <TimeInput value={ints[1]} onInput={onChangeTwo} />
        </>
      ) : null }
    </>
  );
};

export const SmartPlaylistBooleanRule = ({
  onUpdate,
  ...rule
}) => {
  const ops = rule.bool ? [
    { value: 'is_true', op: "IS", name: "is true", sign: "POS" },
    { value: 'is_false', op: "IS", name: "is false", sign: "NEG" },
  ] : [
    { value: 'is_true', op: "IS", name: "is true", sign: "NEG" },
    { value: 'is_false', op: "IS", name: "is false", sign: "POS" },
  ];
  return (
    <OpMenu
      ops={ops}
      op={rule.op}
      sign={rule.sign}
      onChange={({ op, sign }) => onUpdate(Object.assign({}, rule, { op, sign }))}
    />
  );
};

export const SmartPlaylistDateRule = ({
  op,
  times = [],
  onUpdate,
}) => {
  switch (op) {
  case 'WITHIN':
    const t = times.length > 0 ? times[0] : 0;
    const m = [
      30 * 24 * 60 * 60 * 1000,
      7 * 24 * 60 * 60 * 1000,
      24 * 60 * 60 * 1000,
      60 * 60 * 1000,
      60 * 1000,
      1000,
      1
    ].find(x => t % x === 0);
    return (
      <>
        <IntegerInput value={t / m} min={0} max={999} onInput={(val) => onUpdate({ times: [val * m].concat(times.slice(1)) })} />
        <DurationMenu
          value={m}
          onChange={val => onUpdate({ times: [t * val / m].concat(times.slice(1)) })}
        />
      </>
    );
  case 'BETWEEN':
    return (
      <>
        <DateInput value={times[0]} onInput={(val) => onChange({ times: [val].concat(times.slice(1)) })} />
        {'\u00a0 to \u00a0'}
        <DateInput value={times[1]} onInput={(val) => onChange({ times: times.slice(0, 1).concat([val]).concat(times.slice(2)) })} />
      </>
    );
  default:
    return (
      <DateInput value={times[0]} onInput={(val) => onChange({ times: [val].concat(times.slice(1)) })} />
    );
  }
};

const ValueMenu = ({
  options,
  value,
  onChange,
}) => {
  return (
    <MenuInput value={value} options={options} onChange={(opt) => onChange(opt.value)} />
  );
};

export const SmartPlaylistMediaKindRule = ({
  media_kind,
  onUpdate,
}) => {
  const vals = [
    { value: "music", name: "Music" },
    { value: "music_video", name: "Music Video" },
    { value: "movie", name: "Movie" },
    { value: "tv_show", name: "TV Show" },
    { value: "home_video", name: "Home Video" },
    { value: "podcast", name: "Podcast" },
    { value: "audiobook", name: "Audiobook" },
    { value: "book", name: "Book" },
  ];
  return (
    <ValueMenu
      options={vals}
      value={media_kind}
      onChange={val => onUpdate({ media_kind: val })}
    />
  );
};

export const SmartPlaylistPlaylistRule = ({
  playlist,
  onUpdate,
}) => {
  const [playlists, setPlaylists] = useState([]);
  const api = useAPI(API);
  useEffect(() => {
    api.loadPlaylists()
      .then(playlists => {
        const options = [];
        const addPlaylist = (pl, depth) => {
          if (pl.children && pl.children.length > 0) {
            options.push({ name: '\u00a0'.repeat(depth * 2) + pl.name, value: pl.persistent_id, disabled: true });
            pl.children.forEach(child => addPlaylist(child, depth + 1));
          } else if (pl.kind === 'standard') {
            options.push({ name: '\u00a0'.repeat(depth * 2) + pl.name, value: pl.persistent_id });
          }
        };
        playlists.forEach(pl => addPlaylist(pl, 0));
        setPlaylists(options);
      });
  }, [api]);
  return (
    <ValueMenu options={playlists} value={playlist} onChange={val => onUpdate({ playlist: val })} />
  );
};

/*
export const SmartPlaylistLoveRule = ({
  love,
  onUpdate,
}) => {
  const vals = [
    { value: "LOVED", name: "Loved" },
    { value: "DISLIKED", name: "Disliked" },
    { value: "NONE", name: "None" },
  ];
  return (
    <ValueMenu options={vals} value={love} onChange={val => onUpdate({ love: val })} />
  );
};
*/

/*
export const SmartPlaylistCloudRule = ({
  cloud,
  onUpdate,
}) => {
  const vals = [
    { value: "?", name: "Matched" },
    { value: "?", name: "Purchased" },
    { value: "?", name: "Uploaded" },
    { value: "?", name: "Ineligible" },
    { value: "?", name: "Removed" },
    { value: "?", name: "Error" },
    { value: "?", name: "Duplicate" },
    { value: "?", name: "Apple Music" },
    { value: "?", name: "No Longer Available" },
    { value: "?", name: "Not Uploaded" },
  ];
  return (
    <ValueMenu options={vals} value={cloud} onChange={val => onUpdate({ cloud: val })} />
  );
};
*/

/*
export const SmartPlaylistLocationRule = ({
  location,
  onUpdate,
}) => {
  const vals = [
    { value: "?", name: "on this computer" },
    { value: "?", name: "iCloud" },
  ];
  return (
    <ValueMenu options={vals} value={location} onChange={val => onUpdate({ location: val })} />
  );
};
*/

const SmartPlaylistRuleData = ({
  type,
  ...props
}) => {
  switch (type) {
  case "string":
    return (<SmartPlaylistStringRule {...props} />);
  case "int":
    return (<SmartPlaylistIntRule {...props} />);
  case 'star':
    return (<SmartPlaylistRatingRule {...props} />);
  case "boolean":
    return (<SmartPlaylistBooleanRule {...props} />);
  case "date":
    return (<SmartPlaylistDateRule {...props} />);
  case "time":
    return (<SmartPlaylistTimeRule {...props} />);
  case "mediakind":
    return (<SmartPlaylistMediaKindRule {...props} />);
  case "playlist":
    return (<SmartPlaylistPlaylistRule {...props} />);
  /*
  case "love":
    return (<SmartPlaylistLoveRule {...props} />);
  case "cloud":
    return (<SmartPlaylistCloudRule {...props} />);
  case "location":
    return (<SmartPlaylistLocationRule {...props} />);
  */
  default:
    return null;
  }
};

const ops = {
  "string": [
    { value: 'contains', op: "CONTAINS", name: "contains", sign: "STRPOS" },
    { value: 'does_not_contain', op: "CONTAINS", name: "does not contain", sign: "STRNEG" },
    { value: 'is', op: "IS", name: "is", sign: "STRPOS" },
    { value: 'is_not', op: "IS", name: "is not", sign: "STRNEG" },
    { value: 'starts_with', op: "STARTSWITH", name: "begins with", sign: "STRPOS" },
    { value: 'ends_with', op: "ENDSWITH", name: "ends with", sign: "STRPOS" },
  ],
  "int": [
    { value: 'is', op: "IS", name: "is", sign: "POS" },
    { value: 'is_not', op: "IS", name: "is not", sign: "NEG" },
    { value: 'greater_than', op: "GREATERTHAN", name: "is greater than", sign: "POS" },
    { value: 'less_than', op: "LESSTHAN", name: "is less than", sign: "POS" },
    { value: 'between', op: "BETWEEN", name: "is in the range", sign: "POS" },
  ],
  "date": [
    { value: 'is', op: "IS", name: "is", sign: "POS" },
    { value: 'is_not', op: "IS", name: "is not", sign: "NEG" },
    { value: 'greater_than', op: "GREATERTHAN", name: "is after", sign: "POS" },
    { value: 'less_than', op: "LESSTHAN", name: "is before", sign: "POS" },
    { value: 'in_the_last', op: "WITHIN", name: "in the last", sign: "POS" },
    { value: 'not_in_the_last', op: "WITHIN", name: "not in the last", sign: "NEG" },
    { value: 'between', op: "BETWEEN", name: "is in the range", sign: "NEG" },
  ],
};
ops.star = ops.int;
ops.duration = ops.int;

const defaultOps = [
  { value: 'is', op: "IS", name: "is", sign: "POS" },
  { value: 'is_not', op: "IS", name: "is not", sign: "NEG" },
];

export const SmartPlaylistRule = ({
  rule,
  depth,
  onChange,
  onAddRule,
  onDeleteRule,
}) => {
  if (rule.type === 'ruleset') {
    return (<SmartPlaylistRuleSet ruleset={rule.ruleset} depth={depth} onChange={rs => onChange(Object.assign({}, rule, { ruleset: rs}))} onAddRule={onAddRule} onDeleteRule={onDeleteRule} />);
  }
  let field = rule.field;
  if (!field) {
    switch (rule.type) {
    case 'mediakind':
      field = 'media_kind';
      break;
    case 'playlist':
      field = 'playlist_persistent_id';
      break;
    default:
      field = rule.type;
      break;
    }
  }
  return (
    <div className="rule">
      <FieldMenu
        depth={depth}
        value={field}
        onChange={(field, type) => onChange(Object.assign({}, rule, { field, type }))}
      />
      { rule.type !== 'boolean' && (
        <OpMenu
          ops={ops[rule.type] || defaultOps}
          op={rule.op}
          sign={rule.sign}
          onChange={({ op, sign }) => onChange(Object.assign({}, rule, { op, sign }))}
        />
      ) }
      <SmartPlaylistRuleData {...rule} onUpdate={update => onChange(Object.assign({}, rule, update))} />
      <PlusMinus onAdd={onAddRule} onDelete={onDeleteRule} />
      <style jsx>{`
        .rule {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          margin-left: ${depth}em;
          border-bottom: solid var(--border) 1px;
          padding-bottom: 4px;
          margin-top: 4px;
          font-size: 12px;
          line-height: 17px;
        }
      `}</style>
    </div>
  );
};

const SmartPlaylistLimits = ({
  limit,
  onChange,
}) => {
  const onToggle = useCallback((evt) => {
    onChange(evt.target.checked ? { items: 50, field: 'random' } : null);
  }, [onChange]);
  return (
    <>
      <input
        type="checkbox"
        checked={limit !== null && limit !== undefined}
        onClick={onToggle}
      />
      {' \u00a0Limit to\u00a0 '}
      <SmartPlaylistSizeLimit
        disabled={limit === null || limit === undefined}
        items={limit ? limit.items : null}
        size={limit ? limit.size : null}
        time={limit ? limit.time : null}
        onChange={onChange}
      />
      <SmartPlaylistLimitField
        disabled={limit === null || limit === undefined}
        field={limit ? limit.field || 'random' : 'random'}
        desc={limit ? limit.desc || false : false}
        onChange={(field, desc) => onChange({ field, desc })}
      />
    </>
  );
};

const SmartPlaylistLimitField = ({
  disabled,
  field,
  desc,
  onChange,
}) => {
  const options = [
    { value: 'random', desc: false, name: 'random' },
    null,
    { value: 'album', desc: false, name: 'album' },
    { value: 'artist', desc: false, name: 'artist' },
    { value: 'genre', desc: false, name: 'genre' },
    { value: 'name', desc: false, name: 'name' },
    null,
    { value: 'rating', desc: true, name: 'highest rating' },
    { value: 'rating', desc: false, name: 'lowest rating' },
    null,
    { value: 'play_date', desc: true, name: 'most recently played' },
    { value: 'play_date', desc: false, name: 'least recently played' },
    null,
    { value: 'play_count', desc: true, name: 'most often played' },
    { value: 'play_count', desc: false, name: 'least often played' },
    null,
    { value: 'date_added', desc: true, name: 'most recently added' },
    { value: 'date_added', desc: false, name: 'least recently added' },
  ];
  return (
    <>
      <span className={disabled ? 'disabled' : ''}>{' \u00a0selected by\u00a0 '}</span>
      <MenuInput value={field} options={options} disabled={disabled} onChange={(opt) => onChange(opt.value, opt.desc)} />
    </>
  );
};

const limitUnitOptions = [
  { value: 'items', label: 'items', mult: 1, key: 'items', max: 10000 },
  { value: 'bytes', label: 'bytes', mult: 1, key: 'size', max: 10240 },
  { value: 'kB', label: 'kB', mult: 1024, key: 'size', max: 10240 },
  { value: 'MB', label: 'MB', mult: 1024*1024, key: 'size', max: 10240 },
  { value: 'GB', label: 'GB', mult: 1024*1024*1024, key: 'size', max: 10240 },
  { value: 'seconds', label: 'seconds', mult: 1000, key: 'time', max: 99 },
  { value: 'minutes', label: 'minutes', mult: 60*1000, key: 'time', max: 99 },
  { value: 'hours', label: 'hours', mult: 60*60*1000, key: 'time', max: 99 },
  { value: 'days', label: 'days', mult: 24*60*60*1000, key: 'time', max: 99 },
];

const SmartPlaylistSizeLimit = ({
  disabled,
  items,
  size,
  time,
  onChange,
}) => {
  let val, unit;
  if (items !== null && items !== undefined) {
    val = items;
    unit = limitUnitOptions.find((opt) => opt.value = 'items');
  } else if (size !== null && size !== undefined) {
    const mult = size ? Math.pow(1024, Math.floor(Math.log(size) / Math.log(1024))) : 1024;
    unit = limitUnitOptions.find((opt) => opt.key === 'size' && opt.mult === mult);
    if (!unit) {
      unit = limitUnitOptions.find((opt) => opt.value === 'MB');
    }
    val = size / (unit ? unit.mult : 1);
  } else if (time !== null && time !== undefined) {
    unit = limitUnitOptions.filter((opt) => opt.key === 'time').reverse().find((opt) => opt.mult * Math.floor(time / opt.mult) === time);
    if (!unit) {
      unit = limitUnitOptions.find((opt) => opt.value === 'minutes');
    }
    val = time / (unit ? unit.mult : 1);
  } else {
    val = 50;
    unit = limitUnitOptions.find((opt) => opt.value = 'items');
  }
  console.debug('%o', { items, size, time, val, unit });
  const onChangeVal = useCallback((v) => {
    const update = { items: null, size: null, time: null };
    if (v === null || Number.isNaN(v) || v < 0) {
      update[unit.key] = 0;
    } else {
      update[unit.key] = v * unit.mult;
    }
    onChange(update);
  }, [onChange, unit]);
  const onChangeUnit = useCallback((opt) => {
    const update = { items: null, size: null, time: null };
    update[opt.key] = val * opt.mult;
    onChange(update);
  }, [onChange, val]);
  return (
    <>
      <IntegerInput
        disabled={disabled}
        min={0}
        max={unit.max}
        value={Math.round(val)}
        onInput={onChangeVal}
      />
      <MenuInput
        disabled={disabled}
        value={unit.value}
        options={limitUnitOptions}
        onChange={onChangeUnit}
      />
      {' \u00a0 '}
    </>
  );
};

export const SmartPlaylistEditor = ({
  ruleset,
  limit = null,
  onChange,
}) => {
  return (
    <div className="smartEditor">
      <div className="rules">
        <SmartPlaylistRuleSet
          ruleset={ruleset}
          depth={0}
          onChange={rs => onChange({ ruleset: rs, limit })}
          onAddRule={xrule => console.error("can't add rule to top level: %o", xrule)}
          onDeleteRule={() => console.error("can't delete top level rule")}
        />
      </div>
      <div className="limit">
        <SmartPlaylistLimits
          limit={limit}
          onChange={lim => {
            if (lim === null) {
              onChange({ ruleset, limit: null });
            } else {
              onChange({ ruleset, limit: Object.assign({}, limit, lim) });
            }
          }}
        />
      </div>
      <style jsx>{`
        .smartEditor {
          min-width: 800px;
        }
        .smartEditor :global(input),
        .smartEditor :global(select) {
          display: inline-block;
          margin-right: 2px;
          margin-left: 2px;
        }
        .smartEditor :global(input[disabled]),
        .smartEditor :global(select[disabled]) {
          background-color: var(--highlight-blur) !important;
          color: var(--border) !important;
        }
        .smartEditor :global(span.disabled) {
          color: var(--border) !important;
        }
        .smartEditor .limit {
          margin-top: 4px;
          font-size: 12px;
          line-height: 17px;
        }
      `}</style>
    </div>
  );
};
