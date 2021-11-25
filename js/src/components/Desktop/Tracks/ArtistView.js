import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import _JSXStyle from 'styled-jsx/style';
import { useRouteMatch, useHistory } from 'react-router-dom';

import { API } from '../../../lib/api';
import { useAPI } from '../../../lib/useAPI';
import { usePlaybackInfo, useControlAPI } from '../../Player/Context';
import { TH } from '../../../lib/trackList';
import { CoverArt } from '../../CoverArt';
import { Button } from '../../Input/Button';
import { Controls } from './CollectionView';
import AlbumView from './AlbumView';
import AlbumList from '../AlbumList';

const pluralize = (n, sing, plur) => {
  if (n === 1) {
    return `1 ${sing}`;
  }
  const p = plur || `${sing}s`;
  return `${n} ${p}`;
};

const MixButton = ({ artist }) => {
  const [working, setWorking] = useState(false);
  const history = useHistory();
  const api = useAPI(API);
  const onArtistMix = useCallback(() => {
    setWorking(true);
    api.makeArtistMix(artist.name, { maxArtists: 25, maxTracksPerArtist: 5 })
      .then((playlist) => {
        history.push(`/artists/${artist.key}/mix`, { playlist });
      });
  }, [artist, api]);
  return (
    <Button disabled={working} onClick={onArtistMix}>Make Mix</Button>
  );
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
        .header .wrapper .mixButton {
          flex: 0;
          width: min-content;
          white-space: nowrap;
          margin-bottom: 0px !important;
          margin-right: 10px;
          text-align: right;
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
        <div className="mixButton">
          <MixButton artist={artist} />
        </div>
        <Controls tracks={tracks} playback={playback} controlAPI={controlAPI} />
      </div>
      <div className="meta">
        {`${pluralize(artist.albums.length, 'album')}, `}
        {`${pluralize(tracks.length, 'track')}`}
      </div>
    </div>
  );
};

export const ArtistView = () => {
  const [thUpdate, setThUpdate] = useState(0);
  useEffect(() => {
    const callback = () => setThUpdate((orig) => orig + 1);
    TH.on('update', callback);
    return () => {
      TH.off('update', callback);
    };
  }, []);
  const { params } = useRouteMatch();
  const { artistName } = params;
  const playback = usePlaybackInfo();
  const controlAPI = useControlAPI();
  const artist = useMemo(() => {
    const index = TH.index[artistName];
    if (index === null || index === undefined) {
      return null;
    }
    return TH.artists[index] || null;
  }, [artistName, thUpdate]);
  const albums = useMemo(() => {
    if (!artist) {
      return [];
    }
    return artist.albums.map((album) => ({ ...album, artist }));
  }, [artist]);
  if (!artist) {
    return null;
  }
  if (artist.albums.length > 20) {
    return (
      <AlbumList albums={albums} />
    );
  }
  return (
    <div className="artistView">
      <Header artist={artist} playback={playback} controlAPI={controlAPI} />
      { artist.albums.map((album) => (
        <AlbumView
          key={album.key}
          artist={artist}
          album={album}
          playback={playback}
          controlAPI={controlAPI}
        />
      )) }
    </div>
  );
};

export default ArtistView;
