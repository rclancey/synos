import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { Link, useRouteMatch } from 'react-router-dom';

import { API } from '../../lib/api';
import { useAPI } from '../../lib/useAPI';
import { useHistoryState } from '../../lib/history';
import { SongList } from './SongList';
import { LinkButton } from '../Input/Button';

export const Search = ({
  prev,
  onClose,
  onTrackMenu,
}) => {
  const match = useRouteMatch();
  const { search = {} } = useHistoryState();
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
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);
  const onExpand = useCallback(() => setExpand(true), []);
  const onCollapse = useCallback(() => setExpand(false), []);
  const api = useAPI(API);

  useEffect(() => {
    const q = new URLSearchParams(search);
    let params = {};
    if (q.has('query')) {
      params.query = q.get('query');
      setQuery(params.query);
      setExpand(false);
    } else if (Array.from(q.keys()).length > 0) {
      ['genre', 'song', 'album', 'artist'].forEach((k) => {
        if (params.has(k)) {
          params[k] = params.get(k);
        }
      });
      setGenre(params.genre);
      setSong(params.song);
      setAlbum(params.album);
      setArtist(params.artist);
      setExpand(true);
    }
    /*
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
    */
    setLoading(true);
    const abort = { aborted: false };
    const artP = api.searchArtists(params);
    const albP = api.searchAlbums(params);
    const resP = api.search(params);
    Promise.all([artP, albP, resP])
      .then(([art, alb, res]) => {
        if (!abort.aborted) {
          setArtists(art);
          setAlbums(alb);
          setResults(res ? res.tracks : []);
          setLoading(false);
        }
      });
    return () => {
      abort.aborted = true;
    };
  }, [api, search]);

  console.debug('searching %o', search);
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
          loading={loading}
          onCollapse={onCollapse}
        />
      );
    }
    return (
      <SimpleQuery
        query={query}
        setQuery={setQuery}
        loading={loading}
        onExpand={onExpand}
      />
    );
  }, [expand, query, genre, song, album, artist, loading, onCollapse, onExpand]);
  return (
    <SongList
      api={api}
      prev={prev}
      tracks={loading ? [] : results}
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
  loading,
  onCollapse,
}) => {
  const to = useMemo(() => {
    const q = new URLSearchParams();
    if (genre) {
      q.set("genre", genre);
    }
    if (song) {
      q.set("song", song);
    }
    if (album) {
      q.set("album", album);
    }
    if (artist) {
      q.set("artist", artist);
    }
    return {
      pathname: '/search',
      search: q.toString(),
    };
  }, [genre, song, album, artist]);
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
      <div className="center">
        <Link className="button" to={to} component={LinkButton}>Search</Link>
      </div>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : null}
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
        .query .center {
          text-align: center;
          margin-top: 10px;
        }
        .query .loading {
          margin-top: 12px;
        }
      `}</style>
    </div>
  );
};

const SimpleQuery = ({
  query,
  setQuery,
  loading,
  onExpand,
}) => {
  const to = useMemo(() => {
    const q = new URLSearchParams();
    if (query) {
      q.set("query", query);
    }
    return {
      pathname: '/search/elsewhere',
      search: q.toString(),
    };
  }, [query]);
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
      <div className="center">
        <Link className="button" to={to} component={LinkButton}>Search</Link>
      </div>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : null }
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
        .query .center {
          text-align: center;
          margin-top: 10px;
        }
        .query .loading {
          margin-top: 72px;
        }
      `}</style>
    </div>
  );
};

