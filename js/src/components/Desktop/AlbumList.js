import React, { useMemo, useCallback } from 'react';
import _JSXStyle from 'styled-jsx/style';
import useMeasure from 'react-use-measure';
import { Link, useHistory } from 'react-router-dom';

import { TH } from '../../lib/trackList';
import { AutoSizeList } from '../AutoSizeList';
import { CoverArt } from '../CoverArt';

window.thier = TH;

const autoSizerStyle = { overflow: 'overlay' };

const AlbumItem = ({ artist, album }) => (
  <div className="album">
    <Link to={`/albums/${artist.key}/${album.key}`}>
      <CoverArt track={album.tracks[0]} size={160} radius={10} lazy />
      <div className="title">{album.name}</div>
      <div className="artist">{artist.name}</div>
    </Link>
  </div>
);

export const AlbumList = ({ albums }) => {
  const list = useMemo(() => {
    if (albums) {
      return albums;
    }
    return TH.artists
      .map((artist) => artist.albums.map((album) => ({ ...album, artist })))
      .flat();
  }, [albums, TH.artists]);
  const listId = useMemo(() => {
    if (albums && albums.length > 0) {
      return `artistAlbums-${albums[0].artist.key}`;
    }
    return 'albums';
  }, [albums]);
  const [ref, bounds] = useMeasure();
  const n = useMemo(() => Math.max(1, Math.floor((bounds.width - 20) / 170)), [bounds.width]);
  const rowRenderer = useCallback(({ index, style }) => (
    <div className="row" style={style}>
      {list.slice(index * n, (index + 1) * n).map((album) => (
        <AlbumItem
          key={`${album.artist.key}/${album.key}`}
          artist={album.artist}
          album={album}
        />
      ))}
    </div>
  ), [list, n]);
  return (
    <div ref={ref} className="albums">
      <style jsx>{`
        .albums {
          padding-left: 10px;
          padding-top: 10px;
          overflow: overlay;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        .albums :global(.row) {
          display: flex;
        }
        .albums :global(.album) {
          width: 160px;
          margin-right: 10px;
          margin-bottom: 10px;
          font-size: 10px;
        }
        .albums :global(.album .title) {
          font-weight: 500;
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 5px;
        }
        .albums :global(.album .artist) {
          width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
      <AutoSizeList
        id={listId}
        itemCount={Math.ceil(list.length / n)}
        itemSize={200}
        offset={0}
        style={autoSizerStyle}
      >
        {rowRenderer}
      </AutoSizeList>
    </div>
  );
};

export default AlbumList;
