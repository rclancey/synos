import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../../../../lib/api';
import { useAPI } from '../../../../lib/useAPI';
import { Dialog, ButtonRow, Padding } from '../../Dialog';
import Button from '../../../Input/Button';
import { Header } from './Header';
import { Tabs, useTab } from './Tabs';
import { Details } from './Details';
import { Artwork } from './Artwork';
import { Lyrics } from './Lyrics';
import { Options } from './Options';
import { Sorting } from './Sorting';
import { FileInfo } from './FileInfo';
import { Error } from './Error';
import { useGenres } from './genres';

const buttonStyle = {
  width: '25px',
  fontSize: '17px',
};

export const EditSingleTrackInfo = ({
  tracks,
  index = 0,
  onClose,
}) => {
  const [trackIndex, setTrackIndex] = useState(index);
  useEffect(() => setTrackIndex(index), [index]);
  const [editing, setEditing] = useState(tracks);
  useEffect(() => setEditing(tracks), [tracks]);
  const genres = useGenres(editing);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const tabs = [Details, Artwork, Lyrics, Options, Sorting, FileInfo];
  const [Comp, onSelectTab] = useTab(tabs);
  const api = useAPI(API);

  const onChange = useCallback(update => setEditing(orig => {
    console.debug('onChange(%o)', update);
    const out = orig.slice(0);
    out[trackIndex] = Object.assign({}, out[trackIndex], update, { _modified: true });
    return out;
  }), [trackIndex]);

  const onSave = useCallback(() => {
    setSaving(true);
    Promise.all(editing.filter(tr => tr._modified).map(({ _modified, ...tr }) => tr).map(tr => api.updateTrack(tr)))
      .then(() => {
        setSaving(false);
        onClose();
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setSaving(false);
      });
  }, [editing, api, onClose]);

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
      <Tabs tabs={tabs} current={Comp} onChange={onSelectTab} />
      <div style={{ minHeight: '400px' }}>
        <Error error={error} />
        <Comp track={editing[trackIndex]} genres={genres} onChange={onChange} />
      </div>
      <ButtonRow>
        <Button type="secondary"
          disabled={trackIndex === 0}
          onClick={() => setTrackIndex(cur => Math.max(0, cur - 1))}
          style={buttonStyle}
        >{'\u2039'}</Button>
        <Button type="secondary"
          disabled={trackIndex === tracks.length - 1}
          onClick={() => setTrackIndex(cur => Math.min(tracks.length - 1, cur + 1))}
          style={buttonStyle}
        >{'\u203a'}</Button>
        <Padding />
        <Button type="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button disabled={saving} onClick={onSave}>Save</Button>
      </ButtonRow>
    </Dialog>
  );
};
