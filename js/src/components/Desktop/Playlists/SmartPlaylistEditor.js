import React, { useState, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';

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

const ConjunctionMenu = ({
  value,
  onChange,
}) => {
  return (
    <>
      {'Match\u00a0 '}
      <select value={value} onChange={evt => onChange(evt.target.options[evt.target.selectedIndex].value)}>
        <option value="AND">all</option>
        <option value="OR">any</option>
      </select>
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
        <span onClick={onDelete}>{'\u2212'}</span>
        <span onClick={() => onAdd(newRule)}>+</span>
        <span className="ruleset" onClick={() => onAdd(newRuleSetRule())}>{'\u21b3'}</span>
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
          flex: 2;
          text-align: right;
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
  'album_rating': { name: 'Album Rating', type: 'string' },
  'artist': { name: 'Artist', type: 'string' },
  'bpm': { name: 'BPM', type: 'int' },
  'bitrate': { name: 'Bit Rate', type: 'int', unit: 'kbps', multiplier: 1024 },
  'comments': { name: 'Comments', type: 'string' },
  'compilation': { name: 'Compilation', type: 'boolean' },
  'composer': { name: 'Composer', type: 'string' },
  'date_added': { name: 'Date Added', type: 'date' },
  'date_modified': { name: 'Date Modified', type: 'date' },
  'disk_number': { name: 'Disk Number', type: 'int' },
  'genre': { name: 'Genre', type: 'string' },
  'grouping': { name: 'Grouping', type: 'string' },
  'kind': { name: 'Kind', type: 'string' },
  'play_date': { name: 'Last Played', type: 'date' },
  'skip_date': { name: 'Last Skipped', type: 'date' },
  'loved': { name: 'Loved', type: 'love' },
  'media_kind': { name: 'Media Kind', type: 'mediakind' },
  'name': { name: 'Name', type: 'string' },
  'playlist_persistent_id': { name: 'Playlist', type: 'playlist' },
  'play_count': { name: 'Plays', type: 'int' },
  'purchased': { name: 'Purchased', type: 'boolean' },
  'rating': { name: 'Rating', type: 'int', unit: 'stars', multiplier: 20 },
  'sample_rate': { name: 'Sample Rate', type: 'int', unit: 'Hz' },
  'size': { name: 'Size', type: 'int', unit: 'MB', multiplier: 1024 * 1024 },
  'skip_count': { name: 'Skips', type: 'int' },
  'sort_album': { name: 'Sort Album', type: 'string' },
  'sort_album_artist': { name: 'Sort Album Artist', type: 'string' },
  'sort_composer': { name: 'Sort Composer', type: 'string' },
  'sort_name': { name: 'Sort Name', type: 'string' },
  'total_time': { name: 'Time', type: 'int', format: 'time' },
  'track_number': { name: 'Track Number', type: 'int' },
  'year': { name: 'Year', type: 'int' },
};

export const FieldMenu = ({
  value,
  onChange,
}) => {
  return (
    <select
      value={value}
      onChange={evt => {
        const field = evt.target.options[evt.target.selectedIndex].value;
        const type = fields[field].type;
        onChange(field, type);
      }}
    >
      { Object.entries(fields).sort((a, b) => a.name < b.name ? -1 : 1).map(entry => (
        <option key={entry[0]} value={entry[0]}>{entry[1].name}</option>
      )) }
    </select>
  );
};

export const DurationMenu = ({
  value,
  onChange,
}) => {
  const opts = [
    { name: 'months', value: 30 * 24 * 60 * 60 * 1000 },
    { name: 'weeks', value: 7 * 24 * 60 * 60 * 1000 },
    { name: 'days', value: 24 * 60 * 60 * 1000 },
    { name: 'hours', value: 60 * 60 * 1000 },
    { name: 'minutes', value: 60 * 1000 },
    { name: 'seconds', value: 1000 },
    { name: 'milliseconds', value: 1 },
  ];
  return (
    <select value={value} onChange={evt => onChange(opts[evt.target.selectedIndex].value)}>
      { opts.map(opt => (<option key={opt.value} value={opt.value}>{opt.name}</option>)) }
    </select>
  );
};

export const OpMenu = ({
  ops,
  op,
  sign,
  onChange,
}) => {
  const idx = ops.findIndex(x => x.op === op && x.sign === sign);
  return (
    <select value={idx} onChange={evt => onChange(ops[evt.target.selectedIndex])}>
      { ops.map((op, i) => (<option key={i} value={i}>{op.name}</option>)) }
    </select>
  );
};

export const SmartPlaylistStringRule = ({
  strings,
  onUpdate,
}) => {
  return (
    <input
      type="text"
      value={strings[0]}
      onInput={evt => onUpdate({ strings: [evt.target.value].concat(strings.slice(1)) })}
    />
  );
};

export const SmartPlaylistIntRule = ({
  field,
  op,
  ints,
  depth,
  onUpdate,
}) => {
  return (
    <>
      <input type="number" value={ints[0]} onInput={evt => onUpdate({ ints: [parseInt(evt.target.value)].concat(ints.slice(1)) })} />
      { op === 'BETWEEN' ? (
        <>
          {'\u00a0 to \u00a0'}
          <input type="number" value={ints[1]} onInput={evt => onUpdate({ ints: ints.slice(0, 1).concat([parseInt(evt.target.value)]).concat(ints.slice(2)) })} />
        </>
      ) : null }
      { fields[field].unit }
    </>
  );
};

export const SmartPlaylistBooleanRule = ({
  onUpdate,
  ...rule
}) => {
  const ops = rule.bool ? [
    { op: "IS", name: "is true", sign: "POS" },
    { op: "IS", name: "is false", sign: "NEG" },
  ] : [
    { op: "IS", name: "is true", sign: "NEG" },
    { op: "IS", name: "is false", sign: "POS" },
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
  times,
  onUpdate,
}) => {
  const dates = times.map(t => new Date(t).toISOString().substr(0, 10));
  switch (op) {
  case 'WITHIN':
    const t = times[0];
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
        <input
          type="number"
          value={t / m}
          onInput={evt => onUpdate({ times: [parseInt(evt.target.value) * m].concat(times.slice(1)) })}
        />
        <DurationMenu
          value={m}
          onChange={val => onUpdate({ times: [t * val].concat(times.slice(1)) })}
        />
      </>
    );
  case 'BETWEEN':
    return (
      <>
        <input
          type="date"
          value={dates[0]}
          onInput={evt => onUpdate({ times: [new Date(evt.target.value).getTime()].concat(times.slice(1)) })}
        />
        {'\u00a0 to \u00a0'}
        <input
          type="date"
          value={dates[1]}
          onInput={evt => onUpdate({ times: times.slice(0, 1).concat([new Date(evt.target.value).getTime()]).concat(times.slice(2)) })}
        />
      </>
    );
  default:
    return (
      <input
        type="date"
        value={dates[0]}
        onInput={evt => onUpdate({ times: [new Date(evt.target.value).getTime()].concat(times.slice(1)) })}
      />
    );
  }
};

const ValueMenu = ({
  options,
  value,
  onChange,
}) => {
  return (
    <select value={value} onChange={evt => onChange(evt.target.options[evt.target.selectedIndex].value)}>
      { options.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.name}</option>)) }
    </select>
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
  case "boolean":
    return (<SmartPlaylistBooleanRule {...props} />);
  case "date":
    return (<SmartPlaylistDateRule {...props} />);
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
    { op: "CONTAINS", name: "contains", sign: "STRPOS" },
    { op: "CONTAINS", name: "does not contain", sign: "STRNEG" },
    { op: "IS", name: "is", sign: "STRPOS" },
    { op: "IS", name: "is not", sign: "STRNEG" },
    { op: "STARTSWITH", name: "begins with", sign: "STRPOS" },
    { op: "ENDSWITH", name: "ends with", sign: "STRPOS" },
  ],
  "int": [
    { op: "IS", name: "is", sign: "POS" },
    { op: "IS", name: "is not", sign: "NEG" },
    { op: "GREATERTHAN", name: "is greater than", sign: "POS" },
    { op: "LESSTHAN", name: "is less than", sign: "POS" },
    { op: "BETWEEN", name: "is in the range", sign: "POS" },
  ],
  "date": [
    { op: "IS", name: "is", sign: "POS" },
    { op: "IS", name: "is not", sign: "NEG" },
    { op: "GREATERTHAN", name: "is after", sign: "POS" },
    { op: "LESSTHAN", name: "is before", sign: "POS" },
    { op: "WITHIN", name: "in the last", sign: "POS" },
    { op: "WITHIN", name: "not in the last", sign: "NEG" },
    { op: "BETWEEN", name: "is in the range", sign: "NEG" },
  ],
};

const defaultOps = [
  { op: "IS", name: "is", sign: "POS" },
  { op: "IS", name: "is not", sign: "NEG" },
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
  return (
    <>
      <input
        type="checkbox"
        checked={limit !== null}
        onClick={evt => {
          if (limit) {
            onChange(null);
          } else {
            onChange({ items: 50, field: 'random' });
          }
        }}
      />
      {' \u00a0Limit to\u00a0 '}
      <SmartPlaylistItemLimit
        limit={limit !== null}
        items={limit ? (limit.items || 0) : 50}
        onChange={items => onChange({ items })}
      />
      <SmartPlaylistSizeLimit
        limit={limit !== null}
        size={limit ? (limit.size || 0) : 0}
        onChange={size => onChange({ size })}
      />
      <SmartPlaylistTimeLimit
        limit={limit !== null}
        time={limit ? (limit.time || 0) : 0}
        onChange={time => onChange({ time })}
      />
      <SmartPlaylistLimitField
        limit={limit !== null}
        field={limit ? limit.field || 'random' : 'random'}
        desc={limit ? limit.desc || false : false}
        onChange={(field, desc) => onChange({ field, desc })}
      />
    </>
  );
};

const SmartPlaylistLimitField = ({
  limit,
  field,
  desc,
  onChange,
}) => {
  const fields = [
    { value: 'random', desc: false, name: 'random' },
    {},
    { value: 'album', desc: false, name: 'album' },
    { value: 'artist', desc: false, name: 'artist' },
    { value: 'genre', desc: false, name: 'genre' },
    { value: 'name', desc: false, name: 'name' },
    {},
    { value: 'rating', desc: true, name: 'highest rating' },
    { value: 'rating', desc: false, name: 'lowest rating' },
    {},
    { value: 'play_date', desc: true, name: 'most recently played' },
    { value: 'play_date', desc: false, name: 'least recently played' },
    {},
    { value: 'play_count', desc: true, name: 'most often played' },
    { value: 'play_count', desc: false, name: 'least often played' },
    {},
    { value: 'date_added', desc: true, name: 'most recently added' },
    { value: 'date_added', desc: false, name: 'least recently added' },
  ];
  const i = fields.findIndex(f => f.value === field && f.desc === desc);
  return (
    <>
      <span className={limit ? '' : 'disabled'}>{' \u00a0selected by\u00a0 '}</span>
      <select
        disabled={!limit}
        value={i}
        onChange={evt => {
          const f = fields[evt.target.selectedIndex];
          onChange(f.value, f.desc);
        }}
      >
        {fields.map((f, i) => f.value ? (
          <option key={i} value={i}>{f.name}</option>
        ) : (
          <option key={i} value={i} disabled={true}>-------------------</option>
        ))}
      </select>
    </>
  );
};

const SmartPlaylistItemLimit = ({
  limit,
  items,
  onChange,
}) => {
  return (
    <>
      <input
        type="number"
        disabled={!limit}
        min={0}
        max={Math.max((items || 0) + 1, 99)}
        step={1}
        value={items || 0}
        onInput={evt => {
          const n = parseInt(evt.target.value);
          if (n === 0 || Number.isNaN(n)) {
            onChange(null);
          } else {
            onChange(n);
          }
        }}
      />
      <span className={limit ? '' : 'disabled'}>{' \u00a0items\u00a0 '}</span>
    </>
  );
};

const SmartPlaylistSizeLimit = ({
  limit,
  size,
  onChange,
}) => {
  const [sizeUnit, setSizeUnit] = useState(size ? Math.pow(1024, Math.floor(Math.log(size) / Math.log(1024))) : 1024 * 1024);
  return (
    <>
      <input
        type="number"
        disabled={!limit}
        min={0}
        max={1023}
        step={1}
        value={Math.round((size || 0) / sizeUnit)}
        onInput={evt => {
          const n = parseInt(evt.target.value);
          if (n === 0 || Number.isNaN(n)) {
            onChange(null);
          } else {
            onChange(n * sizeUnit);
          }
        }}
      />
      <select
        disabled={!limit}
        value={sizeUnit}
        onChange={evt => {
          const n = parseInt(evt.target.options[evt.target.selectedIndex].value);
          if (size) {
            onChange(n * Math.round(size / sizeUnit));
          }
          setSizeUnit(n);
        }}
      >
        <option value={1}>bytes</option>
        <option value={1024}>kB</option>
        <option value={1024*1024}>MB</option>
        <option value={1024*1024*1024}>GB</option>
      </select>
      {' \u00a0 '}
    </>
  );
};

const SmartPlaylistTimeLimit = ({
  limit,
  time,
  onChange,
}) => {
  const timeUnits = [
    24 * 60 * 60 * 1000,
    60 * 60 * 1000,
    60 * 1000,
    1000,
    1,
  ];
  const [timeUnit, setTimeUnit] = useState(time ? timeUnits.find(x => time % x === 0) : 60 * 60 * 1000);
  return (
    <>
      <input
        type="number"
        disabled={!limit}
        min={0}
        max={99}
        step={1}
        value={Math.round((time || 0) / timeUnit)}
        onInput={evt => {
          const n = parseInt(evt.target.value);
          if (n === 0 || Number.isNaN(n)) {
            onChange(null);
          } else {
            onChange(n * timeUnit);
          }
        }}
      />
      <select
        disabled={!limit}
        value={timeUnit}
        onChange={evt => {
          const n = parseInt(evt.target.options[evt.target.selectedIndex].value);
          if (time) {
            onChange(n * Math.round(time / timeUnit));
          }
          setTimeUnit(n);
        }}
      >
        <option value={1000}>seconds</option>
        <option value={60 * 1000}>minutes</option>
        <option value={60 * 60 * 1000}>hours</option>
        <option value={24 * 60 * 60 * 1000}>days</option>
      </select>
    </>
  );
};

export const SmartPlaylistEditor = ({
  ruleset,
  limit,
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
