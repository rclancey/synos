import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';

export const SubObject = ({ name, cfg, Comp, onChange, ...props }) => {
  const { default_config, raw_config } = cfg;
  const { [name]: dflt } = (default_config || {});
  const { [name]: raw } = (raw_config || {});
  const myCfg = { ...cfg, default_config: dflt || {}, raw_config: raw || {} };
  const myOnChange = useCallback((update) => {
    onChange({ [name]: { ...raw, ...update } });
  }, [raw, onChange]);
  return (
    <Comp name={name} cfg={myCfg} onChange={myOnChange} {...props} />
  );
};

export const ReplaceHome = (path, home, cwd) => {
  if (!path) {
    return path;
  }
  let out = path;
  if (out.startsWith(cwd)) {
    out = '.' + out.substr(cwd.length);
  }
  if (out.startsWith(home)) {
    out = '$HOME' + path.substr(home.length);
  }
  return out;
};

export const TextInput = ({ type = 'text', name, cfg, replacer, onChange, ...props }) => {
  const onInput = useCallback((evt) => {
    let val = evt.target.value;
    if (val === '') {
      val = undefined;
    }
    onChange({ [name]: val });
  }, [name, onChange]);
  const { default_config, raw_config } = cfg;
  const val = useMemo(() => {
    const v = (raw_config ? raw_config[name] : undefined) || '';
    if (replacer) {
      return replacer(v) || '';
    }
    return v;
  }, [raw_config, name, replacer]);
  const ph = useMemo(() => {
    const v = (default_config ? default_config[name] : undefined) || '';
    if (replacer) {
      return replacer(v) || '';
    }
    return v;
  }, [default_config, name, replacer]);
  return (
    <input
      type={type}
      name={name}
      value={val}
      placeholder={ph}
      onInput={onInput}
      {...props}
    />
  );
};

export const MultiStringInput = ({ name, cfg, replacer, onChange, ...props }) => {
  const onInput = useCallback((evt) => {
    let val = evt.target.value;
    if (val === '') {
      val = undefined;
    } else {
      val = val.split('\n');
    }
    onChange({ [name]: val });
  }, [name, onChange]);
  const { default_config, raw_config } = cfg;
  const val = useMemo(() => {
    let v = (raw_config ? raw_config[name] : undefined) || [];
    if (!Array.isArray(v)) {
      v = [v];
    }
    if (replacer) {
      return v.map(replacer).join('\n');
    }
    return v.join('\n');
  }, [raw_config, name, replacer]);
  const ph = useMemo(() => {
    const v = (default_config ? default_config[name] : undefined) || [];
    if (!Array.isArray(v)) {
      v = [v];
    }
    if (replacer) {
      return v.map(replacer).join('\n');
    }
    return v.join('\n');
  }, [default_config, name, replacer]);
  return (
    <textarea
      name={name}
      value={val}
      placeholder={ph}
      onInput={onInput}
      {...props}
    />
  );
};

export const FilenameInput = ({ cfg, ...props }) => {
  const { home_directory, working_directory } = cfg;
  const replacer = useCallback((val) => ReplaceHome(val, home_directory, working_directory), [home_directory, working_directory]);
  return (
    <TextInput
      cfg={cfg}
      replacer={replacer}
      {...props}
    />
  );
};

export const URLInput = ({ ...props }) => (
  <TextInput type="url" {...props} />
);

export const EmailInput = ({ ...props }) => (
  <TextInput type="email" {...props} />
);

export const IntegerInput = ({ name, cfg, onChange, ...props }) => {
  const onInput = useCallback((evt) => {
    let val = evt.target.value;
    if (val === '') {
      val = undefined;
    } else {
      const num = parseInt(val, 10);
      if (!Number.isNaN(num)) {
        val = num
      }
    }
    onChange({ [name]: val });
  }, [name, onChange]);
  const { default_config, raw_config } = (cfg || {});
  const val = useMemo(() => {
    return (raw_config ? raw_config[name] : undefined) || '';
  }, [raw_config, name]);
  const ph = useMemo(() => {
    return (default_config ? default_config[name] : undefined) || '';
  }, [default_config, name]);
  return (
    <input
      type="number"
      name={name}
      step={1}
      value={val}
      placeholder={ph}
      onInput={onInput}
      {...props}
    />
  );
};

export const BoolInput = ({ name, cfg, onChange, ...props }) => {
  const onInput = useCallback((evt) => onChange({ [name]: evt.target.checked }), [name, onChange]);
  const { raw_config } = cfg;
  const val = useMemo(() => {
    return (raw_config ? raw_config[name] : false) || false;
  }, [raw_config, name]);
  return (
    <input
      type="checkbox"
      name={name}
      checked={val}
      onInput={onInput}
      {...props}
    />
  );
};

export const MenuInput = ({ name, cfg, options, onChange, ...props }) => {
  const { raw_config } = (cfg || {});
  const onInput = useCallback((evt) => {
    onChange({ [name]: options[evt.target.selectedIndex].value });
  }, [name, options, onChange]);
  return (
    <select name={name} value={(raw_config || {})[name] || ''} onInput={onInput} {...props}>
      {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label || opt.value}</option>))}
    </select>
  );
};

const durationUnitOptions = [
  { value: 1, label: 'Seconds' },
  { value: 60, label: 'Minutes' },
  { value: 3600, label: 'Hours' },
  { value: 86400, label: 'Days' },
  { value: 604800, label: 'Weeks' },
  { value: 2592000, label: 'Months' },
  { value: 31536000, label: 'Years' },
];

export const DurationInput = ({ name, unitOptions = durationUnitOptions, cfg, onChange, ...props }) => {
  const { raw_config, default_config } = (cfg || {});
  const raw = useMemo(() => {
    if (!raw_config || !raw_config[name]) {
      return { value: '', unit: '' };
    }
    const t = raw_config[name];
    let unit;
    for (let i = unitOptions.length - 1; i >= 0; i -= 1) {
      unit = unitOptions[i].value;
      if (t % unit === 0) {
        return { value: t / unit, unit };
      }
    }
    return { value: t, unit: 1 };
  }, [raw_config, name]);
  const dflt = useMemo(() => {
    if (!default_config || !default_config[name]) {
      return { value: 0, unit: 1 };
    }
    const t = default_config[name];
    let unit;
    for (let i = unitOptions.length - 1; i >= 0; i -= 1) {
      unit = unitOptions[i].value;
      if (t % unit === 0) {
        return { value: t / unit, unit };
      }
    }
    return { value: t, unit: 1 };
  }, [default_config, name]);
  const [unit, setUnit] = useState(raw.unit || dflt.unit || 1);
  const val = useMemo(() => {
    if (!raw_config || !raw_config[name]) {
      return '';
    }
    return raw_config[name] / unit;
  }, [raw_config, name, unit]);
  const ph = useMemo(() => {
    if (!default_config || !default_config[name]) {
      return '';
    }
    return default_config[name] / unit;
  }, [default_config, name, unit]);
  const onChangeUnit = useCallback((update) => {
    if (raw_config && raw_config[name]) {
      onChange({ [name]: raw_config[name] * update.unit / unit });
    }
    setUnit(update.unit);
  }, [raw_config, name, unit, onChange]);
  const onChangeVal = useCallback((update) => {
    console.debug('update = %o', update);
    if (!update[name]) {
      onChange({ [name]: undefined });
    }
    if (typeof update[name] !== 'number') {
      onChange(update);
    }
    onChange({ [name]: update[name] * unit });
  }, [name, unit, onChange]);
  console.debug({ raw_config, default_config, raw, dflt, unit, val, ph });
  return (
    <>
      <IntegerInput
        name={name}
        value={val}
        placeholder={ph}
        onChange={onChangeVal}
      />
      {' '}
      <MenuInput
        name="unit"
        options={unitOptions}
        value={unit}
        onChange={onChangeUnit}
      />
    </>
  );
};

const sizeUnitOptions = [
  { value: 1, label: 'B' },
  { value: 1024, label: 'kB' },
  { value: 1024 * 1024, label: 'MB' },
  { value: 1024 * 1024 * 1024, label: 'GB' },
];

export const SizeInput = ({ ...props }) => (
  <DurationInput unitOptions={sizeUnitOptions} {...props} />
);

