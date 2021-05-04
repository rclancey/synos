import React, { useMemo } from 'react';
import { useTheme } from '../../lib/theme';

export const Index = ({ index, list }) => {
  const colors = useTheme();
  return (
    <div className="index">
      {index.map(idx => (
        <div
          key={idx.name}
          className={idx.scrollTop < 0 ? 'disabled' : ''}
          onClick={() => idx.scrollTop >= 0 && list.current && list.current.scrollTo(idx.scrollTop)}
        >
          {idx.name}
        </div>
      ))}
      <style jsx>{`
        .index {
          position: fixed;
          z-index: 3;
          right: 5px;
          font-size: 12px;
          line-height: 17px;
          color: ${colors.highlightText};
        }
        .index .disabled {
          color: ${colors.text2};
        }
        .index>div {
          padding-left: 1em;
        }
      `}</style>
    </div>
  );
};

const extendIndex = (index) => {
  const last = index[index.length - 1];
  if (last.name === '#') {
    return index;
  }
  for (let i = last.name.toLowerCase().charCodeAt(0) + 1; i <= 122; i++) {
    index.push({
      name: String.fromCharCode(i).toUpperCase(),
      scrollTop: -1,
    });
  }
  if (index[index.length - 1].name !== '#') {
    index.push({
      name: '#',
      scrollTop: -1,
    });
  }
  return index;
};

export const AlbumIndex = ({ albums, artist, height, list }) => {
  const index = useMemo(() => {
    const index = [];
    if (!albums || albums.length === 0) {
      return index;
    }
    let prev = null;
    albums.forEach((album, i) => {
      let first = (artist ? album : album.artist).sort.substr(0, 1);
      if (!first.match(/^[a-z]/)) {
        first = '#';
      }
      if (prev !== first) {
        const n = prev ? prev.charCodeAt(0) + 1 : 'a'.charCodeAt(0);
        const m = first === '#' ? 'z'.charCodeAt(0) : first.charCodeAt(0) - 1;
        for (let j = n; j <= m; j++) {
          index.push({
            name: String.fromCharCode(j).toUpperCase(),
            scrollTop: -1,
          });
        }
        index.push({
          name: first.toUpperCase(),
          scrollTop: Math.floor(i / 2) * height,
        });
        prev = first;
      }
    });
    return extendIndex(index);
  }, [albums, artist, height]);
  return (<Index index={index} list={list} />);
};

export const CommonIndex = ({ items, height, list }) => {
  const index = useMemo(() => {
    const index = [];
    if (!items || items.length === 0) {
      return index;
    } 
    let prev = null;
    items.forEach((item, i) => {
      let first = item.sort.substr(0, 1);
      if (!first.match(/^[a-z]/)) {
        first = '#';
      } 
      if (prev !== first) {
        index.push({ name: first.toUpperCase(), scrollTop: i * height });
        prev = first;
      }
    });
    return extendIndex(index);
  }, [items, height]);
  return (<Index index={index} list={list} />);
};

export const ArtistIndex = ({ artists, height, list }) => (
  <CommonIndex items={artists} height={height} list={list} />
);

export const GenreIndex = ({ genres, height, list }) => (
  <CommonIndex items={genres} height={height} list={list} />
);

