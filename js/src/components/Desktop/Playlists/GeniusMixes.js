import React, { useState, useMemo, useEffect, useContext, useCallback } from 'react';

import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import { Folder } from './Folder';

export const GeniusMixes = ({ selected, onSelect, controlAPI, setLoading }) => {
  const [genres, setGenres] = useState([]);
  const api = useAPI(API);
  useEffect(() => {
    api.listGeniusGenres().then(setGenres);
  }, [api]);
  const folder = useMemo(() => {
    const pls = genres.map((genre) => ({
      persistent_id: `genius-mix:${genre}`,
      name: genre,
    }));
    return {
      persistent_id: 'genius-mix',
      folder: true,
      children: pls,
    };
  }, [genres]);
  const onSelectMix = useCallback((mix) => {
    onSelect(mix);
    const genre = mix.persistent_id.split(':').slice(1).join(':');
    setLoading(true);
    api.makeGeniusMix(genre, {})
      .then((pl) => {
        onSelect({ ...pl, persistent_id: mix.persistent_id });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [onSelect]);
  return (
    <Folder
      device="itunes"
      playlist={folder}
      depth={0}
      indentPixels={12}
      icon="folder"
      name="Genius Mixes"
      selected={selected}
      onSelect={onSelectMix}
      controlAPI={controlAPI}
    />
  );
};

export default GeniusMixes;
