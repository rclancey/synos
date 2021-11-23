import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import _JSXStyle from 'styled-jsx/style';
import {
  NavLink,
  useRouteMatch,
} from 'react-router-dom';

import { TH } from '../../lib/trackList';
import { AutoSizeList } from '../AutoSizeList';
import { CoverArt } from '../CoverArt';
import ArtistView from './Tracks/ArtistView';

const ArtistIndexItem = ({ name, xref }) => {
  const onClick = useCallback(() => {
    if (!xref || !xref.current) {
      return;
    }
    let idx = 0;
    if (name === '#') {
      const re = new RegExp('^[^a-z]');
      idx = TH.artists.findIndex((artist) => artist.key.match(re));
    } else {
      const l = name.toLowerCase();
      idx = TH.artists.findIndex((artist) => artist.key.startsWith(l));
    }
    xref.current.scrollToItem(idx, 'smart');
  }, [name, xref, TH.artists]);
  return (
    <div className="indexItem">
      <div className="anchor" onClick={onClick}>{name}</div>
    </div>
  );
};

const ArtistIndex = ({ xref }) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
  return (
    <div className="artistIndex">
      <style jsx>{`
        .artistIndex {
          /*
          position: relative;
          z-index: 10;
          margin-left: auto;
          */
          height: 100%;
          min-width: 20px;
          max-width: 20px;
          flex: 0;
          display: flex;
          flex-direction: column;
          font-size: 12px;
          align-items: center;
        }
        .artistIndex :global(.indexItem) {
          display: flex;
          flex-direction: row;
          align-items: center;
          flex: 1;
        }
        .artistIndex :global(.anchor) {
          cursor: pointer;
          color: var(--highlight);
        }
      `}</style>
      {letters.map((name) => (<ArtistIndexItem key={name} name={name} xref={xref} />))}
    </div>
  );
};

const ArtistItem = ({ artist, style }) => {
  const { params } = useRouteMatch();
  const { artistName } = params;
  const highlighted = artistName === artist.key;

  return (
    <div className={`artist ${highlighted}`} style={style}>
      <NavLink to={`/artists/${artist.key}`}>
        <CoverArt
          url={`/api/art/artist?artist=${artist.key.replace(/ /g, '%20')}`}
          size={32}
          radius={32}
          lazy
        />
        <div className="name">{artist.name}</div>
      </NavLink>
    </div>
  );
};

export const ArtistList = () => {
  const { params } = useRouteMatch();
  const { artistName } = params;
  const xref = useRef(null);
  const rowRenderer = useCallback(({ index, style }) => (
    <ArtistItem
      artist={TH.artists[index]}
      style={style}
    />
  ), [TH.artists]);
  const initialScrollOffset = useMemo(() => {
    if (!artistName) {
      return null;
    }
    const idx = TH.index[artistName];
    if (idx === null || idx === undefined) {
      return null;
    }
    return Math.max(0, idx - 4) * 53;
  }, [artistName, TH.index, TH.artists]);
  useEffect(() => {
    if (artistName && xref.current) {
      const idx = TH.index[artistName];
      if (idx !== null && idx !== undefined) {
        xref.current.scrollToItem(idx, 'smart');
      }
    }
  }, [artistName]);
  if (TH.artists.length === 0) {
    return null;
  }
  return (
    <div className="artists">
      <style jsx>{`
        .artists {
          display: flex;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }
        .artists .artistList {
          flex: 1;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          border-right: solid var(--border) 1px;
        }
        .artists .artistList :global(.artist) {
          /*
          display: flex;
          align-items: center;
          padding: 10px;
          */
          border-bottom: solid var(--border) 1px;
          box-sizing: border-box;
        }
        .artists .artistList :global(.artist .name) {
          margin-left: 10px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
        .artists .artistList :global(.artist a) {
          display: flex;
          align-items: center;
          padding: 10px;
        }
        .artists .artistList :global(.artist a.active) {
          background: var(--highlight);
          color: var(--inverse);
        }
        .artists .albumViews {
          flex: 4;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
      `}</style>
      <div className="artistList">
        <AutoSizeList
          id="artists"
          xref={xref}
          itemCount={TH.artists.length}
          itemSize={53}
          offset={0}
          initialScrollOffset={initialScrollOffset}
        >
          {rowRenderer}
        </AutoSizeList>
      </div>
      <ArtistIndex xref={xref} />
      <div className="albumViews">
        { artistName ? (<ArtistView />) : null }
      </div>
    </div>
  );
};

export default ArtistList;
