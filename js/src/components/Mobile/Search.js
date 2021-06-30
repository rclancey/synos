import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { SongList } from './SongList';

export const Search = ({
  prev,
  onClose,
  onTrackMenu,
}) => {
  const [query, setQuery] = useState('');
  const [expand, setExpand] = useState(false);
  const [genre, setGenre] = useState('');
  const [song, setSong] = useState('');
  const [album, setAlbum] = useState('');
  const [artist, setArtist] = useState('');
  // eslint-disable-next-line
  const [artists, setArtists] = useState([]);
  // eslint-disable-next-line
  const [albums, setAlbums] = useState([]);
  const [results, setResults] = useState([]);
  const debounce = useRef(null);
  const onExpand = useCallback(() => setExpand(true), []);
  const onCollapse = useCallback(() => setExpand(false), []);
  const api = useAPI(API);

  useEffect(() => {
    let params = {};
    if (expand) {
      params = { genre, song, album, artist };
    } else {
      params = { query };
    }
    if (debounce.current !== null) {
      clearTimeout(debounce.current);
      debounce.current = null;
    }
    debounce.current = setTimeout(() => {
      debounce.current = null;
      const artP = api.searchArtists(params);
      const albP = api.searchAlbums(params);
      const resP = api.search(params);
      Promise.all([artP, albP, resP])
        .then(([art, alb, res]) => {
          setArtists(art);
          setAlbums(alb);
          setResults(res ? res.tracks : []);
        });
    }, 250);
  }, [api, query, expand, genre, song, album, artist]);

  const child = useMemo(() => {
    if (expand) {
      return (
        <ComplexQuery
          genre={genre}
          setGenre={setGenre}
          song={song}
          setSong={setSong}
          album={album}
          setAlbum={setAlbum}
          artist={artist}
          setArtist={setArtist}
          onCollapse={onCollapse}
        />
      );
    }
    return (
      <SimpleQuery
        query={query}
        setQuery={setQuery}
        onExpand={onExpand}
      />
    );
  }, [expand, query, genre, song, album, artist, onCollapse, onExpand]);
  return (
    <SongList
      api={api}
      prev={prev}
      tracks={results}
      withTrackNum={false}
      withCover={true}
      withArtist={true}
      withAlbum={true}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
    >
      {child}
    </SongList>
  );
};

const ComplexRow = ({
  name,
  val,
  setter,
}) => {
  const onChange = useCallback((evt) => setter(evt.target.value), [setter]);
  return (
    <>
      <div className="key">{name}</div>
      <div>
        <input type="text" value={val || ''} onInput={onChange} />
      </div>
    </>
  );
};

const ComplexQuery = ({
  genre,
  setGenre,
  song,
  setSong,
  album,
  setAlbum,
  artist,
  setArtist,
  onCollapse,
}) => {
  return (
    <div className="query">
      <div className="grid">
        <ComplexRow name="song" val={song} setter={setSong} />
        <ComplexRow name="album" val={album} setter={setAlbum} />
        <ComplexRow name="artist" val={artist} setter={setArtist} />
        <ComplexRow name="genre" val={genre} setter={setGenre} />
      </div>
      <span className="collapse" onClick={onCollapse}>
        <span className="fas fa-search-minus" />
        {'\u00a0 Simple Search'}
      </span>
      <style jsx>{`
        .query {
          height: 142px;
          width: 100%;
          padding: 0 1em;
          box-sizing: border-box;
        }
        .grid {
          display: grid;
          grid-template-columns: min-content auto;
          width: 100%;
          margin-bottom: 7px;
        }
        .grid :global(.key) {
          padding-right: 1em;
        }
        .grid :global(input) {
          width: 90%;
        }
      `}</style>
    </div>
  );
};

const SimpleQuery = ({
  query,
  setQuery,
  onExpand,
}) => {
  const onChange = useCallback((evt) => setQuery(evt.target.value), [setQuery]);
  return (
    <div className="query">
      <div className="input">
        <input type="text" value={query || ''} onInput={onChange} />
      </div>
      <span className="expand" onClick={onExpand}>
        <span className="fas fa-search-plus" />
        {'\u00a0 Advanced Search'}
      </span>
      <style jsx>{`
        .query {
          height: 142px;
          width: 100%;
          padding: 0 1em;
          box-sizing: border-box;
        }
        .input {
          margin-bottom: 7px;
        }
        .input input {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

