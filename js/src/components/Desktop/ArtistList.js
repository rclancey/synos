import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import _JSXStyle from 'styled-jsx/style';

import { usePlaybackInfo, useControlAPI } from '../Player/Context';
import { TH } from '../../lib/trackList';
import { CoverArt } from '../CoverArt';
import { Controls, Songs } from './Tracks/CollectionView';

const releaseYear = (track) => {
  if (track.year) {
    return track.year;
  }
  if (track.release_date) {
    return new Date(track.release_date).getFullYear();
  }
};

const pluralize = (n, sing, plur) => {
  if (n === 1) {
    return `1 ${sing}`;
  }
  const p = plur || `${sing}s`;
  return `${n} ${p}`;
};

const Header = ({ artist, playback, controlAPI }) => {
  const tracks = useMemo(() => artist.albums.map((album) => album.tracks).flat(), [artist]);
  return (
    <div className="header">
      <style jsx>{`
        .header {
          padding: 20px;
        }
        .header .wrapper {
          display: flex;
          border-bottom: solid var(--border) 1px;
          align-items: flex-end;
          padding-bottom: 12px;
        }
        .header .artistName {
          flex: 10;
          font-size: 20px;
          font-weight: 700;
        }
        .header .wrapper :global(.controls) {
          flex: 0;
          width: min-content;
          white-space: nowrap;
          margin-bottom: 0px !important;
          text-align: right;
        }
        .header .meta {
          padding-top: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--muted-text);
        }
      `}</style>
      <div className="wrapper">
        <div className="artistName">{artist.name}</div>
        <Controls tracks={tracks} playback={playback} controlAPI={controlAPI} />
      </div>
      <div className="meta">
        {`${pluralize(artist.albums.length, 'album')}, `}
        {`${pluralize(tracks.length, 'track')}`}
      </div>
    </div>
  );
};

const AlbumView = ({ artist, album, playback, controlAPI }) => (
  <div className="albumView">
    <style jsx>{`
      .albumView {
        display: flex;
        /*
        width: 100%;
        */
        padding: 20px;
        overflow-x: hidden;
      }
      .albumView .artwork {
        flex: 0;
        min-width: 256px;
        max-width: 256px;
      }
      .albumView .artwork :global(.coverart) {
        box-shadow: 3px 3px 5px 0px var(--shadow);
      }
      .albumView .contents {
        flex: 10;
        padding-left: 20px;
        overflow-x: hidden;
      }
      .albumView .header {
        display: flex;
        align-items: flex-end;
        padding-bottom: 12px;
      }
      .albumView .wrapper {
        flex: 10;
      }
      .albumView :global(.controls) {
        flex: 0;
        width: min-content;
        white-space: nowrap;
        margin-bottom: 0px !important;
        text-align: right;
      }
      .albumView .albumName {
        flex: 10;
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        overflow-x: hidden;
      }
      .albumView .meta {
        padding-top: 8px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 8px;
        color: var(--muted-text);
      }
    `}</style>
    <div className="artwork">
      <CoverArt track={album.tracks[0]} size={256} lazy />
    </div>
    <div className="contents">
      <div className="header">
        <div className="wrapper">
          <div className="albumName">{album.name}</div>
          <div className="meta">
            {album.tracks[0].genre}
            {' \u2022 '}
            {releaseYear(album.tracks[0])}
          </div>
        </div>
        <Controls tracks={album.tracks} playback={playback} controlAPI={controlAPI} />
      </div>
      <Songs tracks={album.tracks} playback={playback} controlAPI={controlAPI} />
    </div>
  </div>
);

const ArtistView = ({ artist }) => {
  const playback = usePlaybackInfo();
  const controlAPI = useControlAPI();
  return (
    <div className="artistView">
      <Header artist={artist} playback={playback} controlAPI={controlAPI} />
      { artist.albums.map((album) => (
        <AlbumView key={album.key} album={album} playback={playback} controlAPI={controlAPI} />
      )) }
    </div>
  );
};

const ArtistItem = ({ artist, selected, onOpen }) => {
  const highlighted = useMemo(() => {
    if (selected === null) {
      return '';
    }
    return artist.key === selected.key ? 'highlighted' : '';
  }, [artist, selected]);
  const onClick = useCallback(() => onOpen(artist), [artist, onOpen]);

  return (
    <div className={`artist ${highlighted}`} onClick={onClick}>
      <CoverArt
        url={`/api/art/artist?artist=${artist.key.replace(/ /g, '%20')}`}
        size={32}
        radius={32}
        lazy
      />
      <div className="name">{artist.name}</div>
    </div>
  );
};

export const ArtistList = () => {
  const [artist, setArtist] = useState(null);
  const onClose = useCallback(() => setArtist(null), []);
  const artRef = useRef(null);
  const albRef = useRef(null);
  useEffect(() => {
    const key = window.localStorage.getItem('artistListArtist');
    if (key) {
      const idx = TH.index[key];
      if (idx !== undefined) {
        const art = TH.artists[idx];
        if (art) {
          setArtist(art);
          const y = 53 * (idx - 5);
          console.debug('artist %o at index %o, y = %o', art, idx, y);
          if (y > 0) {
            artRef.current.scrollTo(0, y);
          }
        }
      }
    }
  }, []);
  useEffect(() => {
    if (artist !== null) {
      window.localStorage.setItem('artistListArtist', artist.key);
    }
    if (albRef.current) {
      albRef.current.scrollTo(0, 0);
    } else {
      console.debug('artist changed, but albRef missing');
    }
  }, [artist]);
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
          display: flex;
          align-items: center;
          padding: 10px;
          border-bottom: solid var(--border) 1px;
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
        .artists .artistList :global(.artist.highlighted) {
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
      <div ref={artRef} className="artistList">
        { TH.artists.map((art) => (
          <ArtistItem key={art.key} artist={art} selected={artist} onOpen={setArtist} />
        )) }
      </div>
      <div ref={albRef} className="albumViews">
        { artist ? <ArtistView artist={artist} /> : null }
      </div>
    </div>
  );
};

export default ArtistList;
