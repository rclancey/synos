import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API } from '../../../../lib/api';
import { useAPI } from '../../../../lib/useAPI';
import { Dialog, ButtonRow, Padding } from '../../Dialog';
import Button from '../../../Input/Button';
import { Header } from './Header';
import { Tabs, useTab } from './Tabs';
import { Details } from './Details';
import { Artwork } from './Artwork';
import { Options } from './Options';
import { Sorting } from './Sorting';
import { Error } from './Error';
import { useGenres } from './genres';

const keys = [
  'album', 'album_artist', 'artist', 'bpm', 'comments', 'compilation',
  'composer', 'disc_count', 'disc_number', 'genre', 'grouping', 'media_kind',
  'rating', 'release_date', 'sort_album', 'aort_album_artist', 'sort_artist',
  'sort_composer', 'sort_genre', 'track_count', 'track_number',
  'volume_adjustment',
];

const extractCommon = (tracks) => {
  const info = {};
  if (!tracks || tracks.length === 0) {
    return info;
  }
  keys.forEach(key => {
    const v = tracks[0][key];
    if (tracks.slice(1).every(tr => tr[key] === v)) {
      info[key] = v;
    }
  });
  if (info.album && (info.album_artist || info.artist)) {
    info.persistent_id = tracks[0].persistent_id;
  }
  return info;
};

export const EditMultiTrackInfo = ({
  tracks,
  onClose,
}) => {
  const [common, setCommon] = useState({});
  const [editing, setEditing] = useState({});
  const [updated, setUpdated] = useState({});
  useEffect(() => {
    const info = extractCommon(tracks);
    setCommon(info);
    setEditing(info);
    setUpdated({});
  }, [tracks]);
  const genres = useGenres(tracks);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const tabs = [Details, Artwork, Options, Sorting];
  const [Comp, onSelectTab] = useTab(tabs);
  const api = useAPI(API);

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

  const onReset = useCallback(fields => {
    setEditing(orig => {
      const out = Object.assign({}, orig);
      fields.forEach(field => out[field] = common[field]);
      return out;
    });
    setUpdated(orig => {
      const out = Object.assign({}, orig);
      fields.forEach(field => out[field] = false);
      return out;
    });
  }, [common]);

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
  }, [tracks, updated, editing, api, onClose]);

  const title = useMemo(() => {
    if (common.persistent_id) {
      return <Header track={common} />;
    }
    return "Edit Multiple Items";
  }, [common]);

  return (
    <Dialog
      title={title}
      style={{
        left: 'calc(50vw - 250px)',
        top: '100px',
        width: '500px',
        maxHeight: 'none',
      }}
    >
      <Tabs tabs={tabs} current={Comp} onChange={onSelectTab} />
      <div style={{ minHeight: '400px' }}>
        <Error error={error} />
        <Comp track={editing} updated={updated} genres={genres} onChange={onChange} onReset={onReset} />
      </div>
      <ButtonRow>
        <Padding />
        <Button type="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button disabled={saving} onClick={onSave}>Save</Button>
      </ButtonRow>
    </Dialog>
  );
};
