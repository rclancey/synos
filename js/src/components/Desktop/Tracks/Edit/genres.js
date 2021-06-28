import { useState, useEffect } from 'react';
import { API } from '../../../../lib/api';
import { useAPI } from '../../../../lib/useAPI';

export const useGenres = (tracks) => {
  const api = useAPI(API);
  const [genres, setGenres] = useState([]);
  const [allGenres, setAllGenres] = useState([]);
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
  }, [api]);
  useEffect(() => {
    const trGenres = Array.from(new Set(tracks.map(tr => tr.genre).filter(g => !!g)))
      .sort((a, b) => {
        const al = a.toLowerCase();
        const bl = b.toLowerCase();
        if (al < bl) {
          return -1;
        }
        if (al > bl) {
          return 1;
        }
        return 0;
      });
    const out = [];
    genres.forEach(g => {
      while (trGenres.length > 0 && g.toLowerCase() > trGenres[0].toLowerCase()) {
        out.push(trGenres.shift());
      }
      while (trGenres.length > 0 && g.toLowerCase() === trGenres[0].toLowerCase()) {
        trGenres.shift();
      }
      out.push(g);
    });
    setAllGenres(out);
  }, [genres, tracks]);
  return allGenres;
  //return genres;
};
