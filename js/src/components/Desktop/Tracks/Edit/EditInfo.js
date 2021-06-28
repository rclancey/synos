import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CoverArt } from '../../../CoverArt';
import { Dialog, ButtonRow, Button, Padding } from '../../Dialog';
import { useTheme } from '../../../../lib/theme';
import { API } from '../../../../lib/api';
import { useAPI } from '../../../../lib/useAPI';

const startOfDay = t => {
  const d = new Date(t);
  d.setHours(0);
  d.setMinutes(0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

const formatRelDate = (t) => {
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

export const EditTrackInfo = ({
  tracks,
  index = 0,
  onClose,
}) => {
  const [genres, setGenres] = useState([]);
  const [trackIndex, setTrackIndex] = useState(index);
  useEffect(() => setTrackIndex(index), [index]);
  const [editing, setEditing] = useState(tracks);
  const [tab, setTab] = useState(() => Details);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const api = useAPI(API);
  const onSave = useCallback(() => {
    setSaving(true);
    Promise.all(editing.filter(tr => tr._modified).map(({ _modified, ...tr }) => tr).map(tr => api.updateTrack(tr)))
      .then(() => {
        setSaving(false);
        onClose();
      })
      .catch(err => {
        console.error(err);
        setSaving(false);
        setError(err);
      });
  }, [editing, api, onClose]);
  useEffect(() => {
    setEditing(tracks);
    api.loadGenres()
      .then(gs => {
        let total = 0;
        gs.forEach(g => {
          Object.values(g.names).forEach(v => total += v);
        });
        const names = [];
        gs.forEach(g => {
          const n = Object.values(g.names).reduce((acc, cur) => acc + cur, 0);
          if (n > 0.001 * total) {
            const snames = Object.entries(g.names).sort((a, b) => a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0);
            names.push(snames[0][0]);
          }
        });
        setGenres(names);
      });
  }, [tracks, api]);
  const colors = useTheme();
  const onSelectTab = useCallback(tab => setTab(() => tab));
  const onChange = useCallback(update => setEditing(orig => {
    const out = orig.slice(0);
    out[trackIndex] = Object.assign({}, out[trackIndex], update, { _modified: true });
    return out;
  }), [trackIndex]);
  const tabs = [Details, Artwork, Lyrics, Options, Sorting, FileInfo];
  window.infoTabs = tabs;
  const Comp = tab;
  //const header = useCallback(() => <Header track={tracks[trackIndex]} />, [tracks, trackIndex]);
  return (
    <Dialog
      title={<Header track={tracks[trackIndex]}/>}
      style={{
        left: 'calc(50vw - 250px)',
        top: '100px',
        width: '500px',
        maxHeight: 'none',
      }}
    >
      <Tabs tabs={tabs} current={tab} onChange={onSelectTab} />
      <div className="content">
        { error ? <div className="error">{typeof error === 'string' ? error : error.toString()}</div> : null }
        <Comp track={editing[trackIndex]} genres={genres} onChange={onChange} />
      </div>
      <ButtonRow>
        <Button
          label={'\u2039'}
          disabled={trackIndex === 0}
          onClick={() => setTrackIndex(cur => Math.max(0, cur - 1))}
          style={{ width: '25px', fontSize: '22px' }}
        />
        <Button
          label={'\u203a'}
          disabled={trackIndex === tracks.length - 1}
          onClick={() => setTrackIndex(cur => Math.min(tracks.length - 1, cur + 1))}
          style={{ width: '25px', fontSize: '22px' }}
        />
        <Padding />
        <Button
          label="Cancel"
          disabled={saving}
          onClick={onClose}
        />
        <Button
          label="Save"
          disabled={saving}
          highlight={true}
          onClick={onSave}
        />
      </ButtonRow>
      <style jsx>{`
        .error {
          margin-top: 1em;
          color: red;
          font-weight: bold;
        }
        .content {
          min-height: 400px;
        }
        .buttons {
          margin-top: 1em;
          display: flex;
        }
        .buttons .padding {
          flex: 10;
        }
        .buttons button {
          font-size: 14px;
          border: solid ${colors.text} 1px;
          border-radius: 4px;
          color: ${colors.input};
          width: 100px;
          margin-left: 0.5em;
          background: ${colors.inputGradient};
        }
        .buttons button:focus {
          outline: none;
        }
        .buttons button.back,
        .buttons button.next {
          width: 25px;
          font-size: 22px;
          line-height: 17px;
        }
        .buttons button.save {
          background: ${colors.highlightText};
        }
        .buttons button[disabled] {
          color: #999;
          background: ${colors.disabledBackground} !important;
        }
      `}</style>
    </Dialog>
  );
};

export const EditMultiTrackInfo = ({
  tracks,
  onClose,
}) => {
  const [common, setCommon] = useState({});
  const [editing, setEditing] = useState({});
  const [updated, setUpdated] = useState({});
  useEffect(() => {
    const info = {};
    const keys = ['album', 'album_artist', 'artist', 'bpm', 'comments', 'compilation', 'composer', 'disc_count', 'disc_number', 'genre', 'grouping', 'media_kind', 'rating', 'release_date', 'sort_album', 'aort_album_artist', 'sort_artist', 'sort_composer', 'sort_genre', 'track_count', 'track_number', 'volume_adjustment'];
    keys.forEach(key => {
      const v = tracks[0][key];
      if (tracks.slice(1).every(tr => tr[key] === v)) {
        info[key] = v;
      }
    });
    setCommon(info);
    setEditing(info);
    setUpdated({});
  }, [tracks]);
  const [genres, setGenres] = useState([]);
  const [tab, setTab] = useState(() => Details);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const api = useAPI(API);
  const onSave = useCallback(() => {
    setSaving(true);
    const update = {};
    Object.entries(updated).forEach(entry => {
      if (entry[1]) {
        update[entry[0]] = editing[entry[0]];
      }
    });
    api.updateTracks(tracks, update)
      .then(() => {
        setSaving(false);
        onClose();
      })
      .catch(err => {
        console.error(err);
        setSaving(false);
        setError(err);
      });
  }, [updated, editing, api, onClose]);
  useEffect(() => {
    api.loadGenres()
      .then(gs => {
        let total = 0;
        gs.forEach(g => {
          Object.values(g.names).forEach(v => total += v);
        });
        const names = [];
        gs.forEach(g => {
          const n = Object.values(g.names).reduce((acc, cur) => acc + cur, 0);
          if (n > 0.001 * total) {
            const snames = Object.entries(g.names).sort((a, b) => a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0);
            names.push(snames[0][0]);
          }
        });
        setGenres(names);
      });
  }, [tracks, api]);
  const colors = useTheme();
  const onSelectTab = useCallback(tab => setTab(() => tab));
  const onChange = useCallback(update => {
    setEditing(orig => Object.assign({}, orig, update));
    setUpdated(orig => {
      const out = Object.assign({}, orig);
      Object.entries(update).forEach(entry => {
        const key = entry[0];
        const val = entry[1];
        if (val !== common[key]) {
          out[key] = true;
        } else {
          out[key] = false;
        }
      });
      return out;
    });
  }, [common]);
  const tabs = [Details, Artwork, Options, Sorting];
  const Comp = tab;
  return (
    <Dialog
      title="Edit Multiple Items"
      style={{
        left: 'calc(50vw - 250px)',
        top: '100px',
        width: '500px',
        maxHeight: 'none',
      }}
    >
      <Tabs tabs={tabs} current={tab} onChange={onSelectTab} />
      <div className="content">
        { error ? <div className="error">{typeof error === 'string' ? error : error.toString()}</div> : null }
        <Comp track={editing} updated={updated} genres={genres} onChange={onChange} />
      </div>
      <div className="buttons">
        <div className="padding" />
        <button disabled={saving} className="cancel" onClick={onClose}>Cancel</button>
        <button disabled={saving} className="save" onClick={onSave}>Save</button>
      </div>
      <style jsx>{`
        .error {
          margin-top: 1em;
          color: red;
          font-weight: bold;
        }
        .content {
          min-height: 400px;
        }
        .buttons {
          margin-top: 1em;
          display: flex;
        }
        .buttons .padding {
          flex: 10;
        }
        .buttons button {
          font-size: 14px;
          border: solid ${colors.text} 1px;
          border-radius: 4px;
          color: ${colors.input};
          width: 100px;
          margin-left: 0.5em;
          background: ${colors.inputGradient};
        }
        .buttons button:focus {
          outline: none;
        }
        .buttons button.back,
        .buttons button.next {
          width: 25px;
          font-size: 22px;
          line-height: 17px;
        }
        .buttons button.save {
          background: ${colors.highlightText};
        }
        .buttons button[disabled] {
          color: #999;
          background: ${colors.disabledBackground} !important;
        }
      `}</style>
    </Dialog>
  );
};

const Header = ({
  track,
}) => {
  const colors = useTheme();
  return (
    <div className="header">
      <CoverArt track={track} size={100} radius={5} />
      <div className="info">
        <div className="name">{track.name}</div>
        <div className="artist">{track.artist}</div>
        <div className="album">{track.album}</div>
      </div>
      <style jsx>{`
        .header {
          display: flex;
        }
        .header :global(.coverart) {
          flex: 1;
        }
        .header .info {
          flex: 10;
          margin-left: 1em;
          margin-top: 10px;
          overflow: hidden;
        }
        .header .info div {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .header .info .name {
          font-size: 24px;
          color: ${colors.panelText};
        }
        .header .info .artist, .header .info .album {
          font-size: 12px;
          color: #${colors.text};
        }
      `}</style>
    </div>
  );
};

const Tabs = ({
  tabs,
  current,
  onChange,
}) => {
  const colors = useTheme();
  return (
    <div className="tabs">
      { tabs.map((tab, i) => <Tab key={i} tab={tab} selected={tab === current} onClick={() => onChange(tab)} />) }
      <style jsx>{`
        .tabs {
          border: solid ${colors.text} 1px;
          border-radius: 4px;
          overflow: hidden;
          width: 100%;
          display: flex;
          margin-bottom: 1em;
        }
        .tabs :global(.tab) {
          flex: 1;
          text-align: center;
          background-color: ${colors.tabBackground};
          color: ${colors.tabColor};
          border-left: solid ${colors.text} 1px;
          border-right: solid ${colors.text} 1px;
          font-size: 14px;
          padding: 2px;
          cursor: default;
        }
        .tabs :global(.tab:first-child) {
          border-left: none;
        }
        .tabs :global(.tab:last-child) {
          border-right: none;
        }
        .tabs :global(.tab.selected) {
          background-color: ${colors.highlightText};
          color: ${colors.highlightInverse};
        }
      `}</style>
    </div>
  );
};

const Tab = ({
  tab,
  selected,
  onClick,
}) => {
  return (
    <div className={`tab ${selected ? 'selected' : ''}`} onClick={onClick}>{tab.name}</div>
  );
};

const TextInput = ({
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

const IntegerInput = ({
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

const DateInput = ({
  track,
  field,
  onChange,
}) => {
  let dtstr = '';
  if (track[field] !== null && track[field] !== undefined) {
    const d = new Date(track[field]);
    dtstr = Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(d);
  }
  return (
    <input
      type="date"
      value={dtstr}
      style={{fontFamily: 'inherit'}}
      onChange={evt => {
        if (!evt.target.value) {
          return onChange({ [field]: null });
        }
        const d = new Date(evt.target.value + 'T00:00:00Z');
        return onChange({ [field]: d.getTime() });
      }}
    />
  );
};

const StarInput = ({
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
        <span key={i} onClick={() => onChange((i+1)*20)}>{f ? '\u2605' : '\u2606'}</span>
      )) }
      <style jsx>{`
        .stars {
          color: ${colors.highlightText}
        }
      `}</style>
    </div>
  );
  /*
  return (
    <IntegerInput track={track} field={field} min={0} max={100} onChange={onChange} />
  );
  */
};

const BooleanInput = ({ track, field, children, onChange }) => {
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

const Grid = ({ children }) => (
  <div className="grid">
    {children}
    <style jsx>{`
      .grid {
        display: grid;
        grid-template-columns: auto auto;
        font-size: 12px;
      }
    `}</style>
  </div>
);

const GridRow = ({ label, children }) => (
  <>
    <GridKey>{label}</GridKey>
    <GridValue>{children}</GridValue>
  </>
);

const GridSpacer = () => (
  <GridRow label={'\u00a0'} />
);

const GridKey = ({ children }) => (
  <div className="key">
    {children}
    <style jsx>{`
      .key {
        text-align: right;
        margin-left: 3em;
        margin-right: 1em;
        line-height: 23px;
      }
    `}</style>
  </div>
);

const GridValue = ({ children }) => {
  const colors = useTheme();
  return (
    <div className="value">
      {children}
      <style jsx>{`
        .value {
          margin-right: 3em;
          line-height: 23px;
        }
        .value :global(input) {
          border: solid ${colors.inputGradient} 1px;
          color: ${colors.input};
          background-color: ${colors.inputBackground};
          font-size: 12px;
          padding: 2px;
          margin: 1px;
        }
        .value :global(input[type="text"]) {
          width: calc(100% - 24px);
        }
      `}</style>
    </div>
  );
};

const GenreInput = ({ track, genres, onChange }) => {
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

const Updated = ({
  updated,
  field,
  fields,
}) => {
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
    <div className="updated">
      {'\u2713'}
      <style jsx>{`
        div.updated {
          display: inline-block;
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

const Details = ({
  track,
  updated,
  genres,
  onChange,
}) => {
  const colors = useTheme();
  const nextYear = new Date().getFullYear() + 10;
  return (
    <Grid>
      {updated ? null : (
        <GridRow label="song">
          <TextInput track={track} field="name" onChange={onChange} />
          <Updated updated={updated} field="name" />
        </GridRow>
      )}
      <GridRow label="artist">
        <TextInput track={track} field="artist" onChange={onChange} />
        <Updated updated={updated} field="artist" />
      </GridRow>
      <GridRow label="album">
        <TextInput track={track} field="album" onChange={onChange} />
        <Updated updated={updated} field="album" />
      </GridRow>
      <GridRow label="album artist">
        <TextInput track={track} field="album_artist" onChange={onChange} />
        <Updated updated={updated} field="album_artist" />
      </GridRow>
      <GridRow label="composer">
        <TextInput track={track} field="composer" onChange={onChange} />
        <Updated updated={updated} field="composer" />
      </GridRow>
      <GridRow label="grouping">
        <TextInput track={track} field="grouping" onChange={onChange} />
        <Updated updated={updated} field="grouping" />
      </GridRow>
      <GridRow label="genre">
        <GenreInput track={track} genres={genres}  onChange={onChange} />
        <Updated updated={updated} field="genre" />
      </GridRow>

      <GridSpacer />
      <GridRow label="release date">
        <DateInput track={track} field="release_date" onChange={onChange} />
        <Updated updated={updated} field="release_date" />
      </GridRow>
      <GridRow label="track">
        <IntegerInput
          track={track}
          field="track_number"
          min={1}
          max={999}
          onChange={onChange}
        />
        {' of '}
        <IntegerInput
          track={track}
          field="track_count"
          min={1}
          max={999}
          onChange={onChange}
        />
        <Updated updated={updated} fields={["track_number", "track_count"]} />
      </GridRow>
      <GridRow label="disc number">
        <IntegerInput
          track={track}
          field="disc_number"
          min={1}
          max={999}
          onChange={onChange}
        />
        {' of '}
        <IntegerInput
          track={track}
          field="disc_count"
          min={1}
          max={999}
          onChange={onChange}
        />
        <Updated updated={updated} fields={["disc_number", "disc_count"]} />
      </GridRow>
      <GridRow label="compilation">
        <BooleanInput track={track} field="compilation" onChange={onChange}>
          Album is a compilation of songs by various artists
        </BooleanInput>
        <Updated updated={updated} field="compilation" />
      </GridRow>

      <GridSpacer />
      <GridRow label="rating">
        <StarInput track={track} field="rating" onChange={onChange} />
        <Updated updated={updated} field="rating" />
      </GridRow>
      <GridRow label="bpm">
        <IntegerInput
          track={track}
          field="bpm"
          min={1}
          max={1000}
          onChange={onChange}
        />
        <Updated updated={updated} field="bpm" />
      </GridRow>
      {updated ? null : (
        <GridRow label="play count">
          {track.play_count}
          {track.play_date ? ` (Last played ${formatRelDate(track.play_date)})` : null}
        </GridRow>
      )}
      <GridRow label="comments">
        <TextInput track={track} field="comments" onChange={onChange} />
        <Updated updated={updated} field="comments" />
      </GridRow>
    </Grid>
  );
};

const Artwork = ({
  track,
  onChange,
}) => {
  const fileInput = useRef();
  const onSetImage = useCallback(evt => {
    const fr = new FileReader();
    fr.onload = revt => {
      onChange({ artwork_url: revt.target.result });
    };
    fr.readAsDataURL(evt.target.files[0]);
  }, [onChange]);
  useEffect(() => {
    const listener = evt => {
      if (evt.clipboardData.items.length > 0) {
        const f = evt.clipboardData.items[0].getAsFile();
        if (f && f.type.startsWith('image/')) {
          const fr = new FileReader();
          fr.onload = revt => {
            onChange({ artwork_url: revt.target.result });
          };
          fr.readAsDataURL(f);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('paste', listener, true);
      return () => {
        window.removeEventListener('paste', listener, true);
      };
    }
  }, [onChange]);
  const url = useMemo(() => {
    if (track.artwork_url) {
      return track.artwork_url;
    }
    if (track.persistent_id) {
      return `/api/art/track/${track.persistent_id}`;
    }
    if (track.sort_album && (track.sort_artist || track.sort_album_artist)) {
      return `/api/art/album?artist=${track.sort_album_artist || track.sort_artist}&album=${track.sort_album}`;
    }
    return '/nocover.jpg';
  }, [track]);
  return (
    <div className="artwork">
      Album Artwork
      <div className="cover">
        <img src={url} onClick={() => fileInput.current.click()} />
      </div>
      <input ref={fileInput} type="file" accept=".jpg,.png,image/png,image/jpg" onChange={onSetImage} />
      <style jsx>{`
        .artwork {
          font-size: 14px;
          font-weight: bold;
        }
        .artwork .cover {
          margin-top: 1em;
          width: 500px;
          height: 300px;
          line-height: 300px;
          text-align: center;
        }
        .artwork .cover img {
          max-width: 300px;
          max-height: 300px;
        }
        .artwork input[type="file"] {
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
};

const Lyrics = ({
  track,
  onChange,
}) => {
  return (
    <div className="lyrics">
      <p>No Lyrics Available</p>
      <p>There aren't any lyics available for this song</p>
    </div>
  );
};

const formatTime = t => {
  if (t === null || t === undefined) {
    return '';
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

const TimeInput = ({
  value,
  max,
  placeholder,
  onChange,
  ...props,
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
    <input type="number" min={0} max={formatTime(max)} step={0.001} value={formatTime(value)} placeholder={formatTime(placeholder)} onChange={onChangeParsed} {...props} />
  );
};

const RangeInput = ({
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

const Options = ({
  track,
  updated,
  onChange,
}) => {
  const colors = useTheme();
  return (
    <Grid>
      <GridRow label="media kind">
        <select value={track.media_kind || ''} onChange={evt => onChange({ media_kind: evt.target.value })}>
          <option value="music">Music</option>
          <option value="movie">Movie</option>
          <option value="podcast">Podcast</option>
          <option value="audiobook">Audiobook</option>
          <option value="music_video">Music Video</option>
          <option value="tv_show">TV Show</option>
          <option value="home_video">Home Video</option>
          <option value="voice_memo">Voice Memo</option>
          <option value="book">Book</option>
        </select>
        <Updated updated={updated} field="media_kind" />
      </GridRow>

      {updated ? null : (<>
        <GridSpacer />
        <GridRow label="start">
          <TimeInput
            value={track.start_time}
            max={track.total_time}
            placeholder={0}
            onChange={t => onChange({ start_time: t })}
          />
        </GridRow>
        <GridRow label="end">
          <TimeInput
            value={track.end_time}
            max={track.total_time}
            placeholder={track.total_time}
            onChange={t => onChange({ end_time: t })}
          />
        </GridRow>
      </>)}

      <GridSpacer />
      <GridRow label="volume adjust">
        <RangeInput
          value={track.volume_adjustment}
          onChange={v => onChange({ volume_adjustment: v })}
        />
        <Updated updated={updated} field="volume_adjustment" />
      </GridRow>
    </Grid>
  );
};

const Sorting = ({
  track,
  updated,
  onChange,
}) => {
  return (
    <Grid>
      {updated ? null : (<>
        <GridRow label="name">
          <TextInput track={track} field="name" onChange={onChange} />
          <Updated updated={updated} field="name" />
        </GridRow>
        <GridRow label="sort as">
          <TextInput
            track={track}
            field="sort_name"
            placeholder={track.name}
            onChange={onChange}
          />
          <Updated updated={updated} field="sort_name" />
        </GridRow>
        <GridSpacer />
      </>)}

      <GridRow label="album">
        <TextInput track={track} field="album" onChange={onChange} />
        <Updated updated={updated} field="album" />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_album"
          placeholder={track.album}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_album" />
      </GridRow>

      <GridSpacer />
      <GridRow label="album artist">
        <TextInput track={track} field="album_artist" onChange={onChange} />
        <Updated updated={updated} field="album_artist" />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_album_artist"
          placeholder={track.album_artist}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_album_artist" />
      </GridRow>

      <GridSpacer />
      <GridRow label="artist">
        <TextInput track={track} field="artist" onChange={onChange} />
        <Updated updated={updated} field="artist" />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_artist"
          placeholder={track.artist}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_artist" />
      </GridRow>

      <GridSpacer />
      <GridRow label="composer">
        <TextInput track={track} field="composer" onChange={onChange} />
        <Updated updated={updated} field="composer" />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_composer"
          placeholder={track.composer}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_composer" />
      </GridRow>
    </Grid>
  );
};

const formatDuration = t => {
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

const formatSize = s => {
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

const formatDate = t => {
  const d = new Date(t);
  const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  const m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes().toString();
  const p = d.getHours() < 12 ? 'AM' : 'PM';
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getYear() % 100} ${h}:${m} ${p}`;
};

const FileInfo = ({
  track,
}) => {
  return (
    <Grid>
      <GridRow label="id">{track.persistent_id}</GridRow>
      <GridRow label="kind">{track.kind}</GridRow>
      <GridRow label="duration">{formatDuration(track.total_time)}</GridRow>
      <GridRow label="size">{formatSize(track.size)}</GridRow>
      <GridRow label="bit rate">{track.bitrate} kbps</GridRow>
      <GridRow label="sample rate">{(track.sample_rate / 1000).toFixed(3)} kHz</GridRow>

      <GridSpacer />
      { track.purchased ? (
        <GridRow label="purchase date">{formatDate(track.purchase_date)}</GridRow>
      ) : null }
      <GridRow label="date modified">{formatDate(track.date_modified)}</GridRow>
      <GridRow label="date added">{formatDate(track.date_added)}</GridRow>

      <GridSpacer />
      <GridRow label="location">
        <span style={{lineHeight: '16px', display: 'inline-block', marginTop: '4px'}}>{track.location}</span>
      </GridRow>
    </Grid>
  );
};

