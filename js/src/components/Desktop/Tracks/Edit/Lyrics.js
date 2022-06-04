import React, { useCallback, useEffect, useState } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { API } from '../../../../lib/api';
import { useAPI } from '../../../../lib/useAPI';
import Button from '../../../Input/Button';

export const Lyrics = ({
  track,
  onChange,
}) => {
  const api = useAPI(API);
  const [lyrics, setLyrics] = useState(track?.lyrics);
  const [choices, setChoices] = useState([]);
  const [index, setIndex] = useState(0);
  const [unsaved, setUnsaved] = useState(false);
  useEffect(() => {
    setLyrics(track?.lyrics);
    setChoices([]);
    setIndex(0);
    if (api && track) {
      api.getLyrics(track.persistent_id)
        .then((res) => {
          if (res.lyrics) {
            setUnsaved(false);
            setLyrics(res.lyrics);
          } else if (res.results) {
            setUnsaved(true);
            if (res.results.length === 1) {
              setLyrics(res.results[0].lyrics);
            } else {
              setChoices(res.results);
              setIndex(0);
              setLyrics(res.results[0].lyrics);
            }
          }
        });
    }
  }, [api, track]);
  const onChoose = useCallback((evt) => {
    const index = evt.target.selectedIndex;
    api.getLyrics(track.persistent_id, index)
      .then((res) => {
        if (res.results && index < res.results.length) {
          setLyrics(res.results[index].lyrics);
        }
      });
  }, [api, track]);
  const onSave = useCallback(() => {
    api.setLyrics(track.persistent_id, lyrics)
      .then((tr) => {
        setLyrics(tr?.lyrics);
        setUnsaved(false);
      });
  }, [api, track, lyrics]);
  return (
    <div className="lyrics">
      <style jsx>{`
        .lyrics {
          max-height: 400px;
          overflow: auto;
        }
        .lyrics .text {
          white-space: pre-wrap;
          font-size: 12px;
        }
      `}</style>
      { choices.length > 0 ? (
        <select onChange={onChoose}>
          {choices.map((choice) => (
            <option key={choice.url} value={choice.url}>{choice.artist} / {choice.song}</option>
          ))}
        </select>
      ) : null }
      { lyrics ? (
        <p className="text">
          {lyrics}
          <br />
          { unsaved ? (
            <Button onClick={onSave}>Save</Button>
          ) : null }
        </p>
      ) : (
        <>
          <p>No Lyrics Available</p>
          <p>There aren't any lyics available for this song</p>
        </>
      ) }
    </div>
  );
};

Lyrics.displayName = 'Lyrics';
