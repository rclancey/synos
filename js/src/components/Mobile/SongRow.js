import React, { useMemo } from 'react';
import _JSXStyle from 'styled-jsx/style';
//import { useDrag, useDrop } from 'react-dnd';
import { areEqual } from 'react-window';
import { DotsMenu } from './TrackMenu';
import { AlbumImage } from './AlbumList';
import { ArtistImage } from './ArtistImage';
import { CoverArt } from '../CoverArt';
import { Icon } from '../Icon';
import { AddIcon, DeleteIcon } from './ActionIcon';
import { Link } from './Link';

export const SongRow = React.memo(({
  data,
  index,
  style,
}) => {
  const track = useMemo(() => {
    return data.tracks[data.editing ? index + 1 : index];
  }, [data, index]);
  if (data.onBeginAdd && index === 0) {
    return (
      <div className="item add" style={style} onClick={() => data.onBeginAdd()}>
        <Icon name="add" size={36} />
        <div className="action">Add Music</div>
      </div>
    );
  }

  if (track.persistent_id) {
    return (
      <div className="item" style={style}>
        <InteriorRow
          index={index}
          len={data.len}
          playlist={data.playlist}
          track={track}
          withTrackNum={data.withTrackNum}
          withCover={data.withCover}
          withArtist={data.withArtist}
          withAlbum={data.withAlbum}
          editing={data.editing}
          onTrackMenu={data.onTrackMenu}
          onAdd={data.onAdd}
          onMove={data.onMove}
          onDelete={data.onDelete}
        />
      </div>
    );
  }
  if (track.artist) {
    return (
      <div className="item" style={style}>
        <AlbumRow album={track} />
      </div>
    );
  }
  return (
    <div className="item" style={style}>
      <ArtistRow artist={track} />
    </div>
  );
}, areEqual);

const ArtistRow = ({ artist }) => {
  const name = useMemo(() => {
    return Object.entries(artist.names).sort((a, b) => cmp(b[1], a[1]))[0][0];
  }, [artist]);
  return (
    <div className="item">
      <style jsx>{`
        .item :global(a) {
          text-decoration: none;
          color: inherit;
          display: flex;
          padding: 9px 9px 0px 9px;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }
        .item.editing {
          border-bottom: solid var(--border) 1px;
        }
        .item :global(.fa-bars) {
          line-height: 44px;
        }
        .item :global(.icon) {
          margin-top: 4px;
        }
        .item :global(.title) {
          flex: 10;
          display: flex;
          font-size: 18px;
          padding: 5px 0px 0px 0px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-left: 9px;
          margin-right: 0.5em;
        }
        .item :global(.title .song) {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
      <Link to={`/artists/${artist.sort}`} title={name}>
        <ArtistImage artist={artist} size={48} />
        <div className="title">
          <div className="song">{name}</div>
        </div>
      </Link>
    </div>
  );
};

const AlbumRow = ({ album }) => {
  const name = useMemo(() => {
    return Object.entries(album.names).sort((a, b) => cmp(b[1], a[1]))[0][0];
  }, [album]);
  const artist = useMemo(() => {
    return Object.entries(album.artist.names).sort((a, b) => cmp(b[1], a[1]))[0][0];
  }, [album]);
  return (
    <div className="item">
      <style jsx>{`
        .item :global(a) {
          text-decoration: none;
          color: inherit;
          display: flex;
          padding: 9px 9px 0px 9px;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }
        .item.editing {
          border-bottom: solid var(--border) 1px;
        }
        .item :global(.fa-bars) {
          line-height: 44px;
        }
        .item :global(.icon) {
          margin-top: 4px;
        }
        .item :global(.title) {
          flex: 10;
          display: flex;
          font-size: 18px;
          padding: 5px 0px 0px 0px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-left: 9px;
          margin-right: 0.5em;
        }
        .item :global(.title .song) {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item :global(.title .artist) {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 14px;
        }
        .item :global(.songArtistAlbum) {
          flex: 10;
          overflow: hidden;
        }
      `}</style>
      <Link to={`/albums/${album.artist.sort}/${album.sort}`} title={name}>
        <AlbumImage album={album} size={48} />
        <div className="title">
          <div className="songArtistAlbum">
            <div className="song">{name}</div>
            <div className="artist">{artist}</div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const InteriorRow = React.memo(({
  index,
  len,
  playlist,
  track,
  withTrackNum = false,
  withCover = false,
  withArtist = false,
  withAlbum = false,
  editing = false,
  onTrackMenu,
  onAdd,
  onMove,
  onDelete,
}) => {
  /*
  const [dragCollect, connectDragSource, preview] = useDrag({
    item: {
      type: 'Track',
      playlist,
      track,
      origIndex: index,
    },
    begin(monitor) {
      console.debug('begin drag');
    },
    collect(monitor) {
      return {
        opacity: monitor.isDragging() ? 0.4 : 1,
      };
    },
    isDragging(monitor) {
      return monitor.getItem().track === track;
    },
  });
  const [dropCollect, connectDropTarget] = useDrop({
    accept: ['Track'],
    drop(item, monitor) {
      if (onMove) {
        onMove(item, index);
      }
    },
    collect(monitor, props) {
      return {
        isOver: monitor.isOver(),
      };
    },
  });
  return connectDropTarget(
  */
  const del = useMemo(() => {
    if (editing) {
      return <DeleteIcon size={36} onDelete={() => onDelete(track, index)} />
    }
    return null;
  }, [editing, onDelete, track, index]);
  const add = useMemo(() => {
    if (onAdd !== null && onAdd !== undefined) {
      return <AddIcon size={36} onAdd={() => onAdd(track)} />
    }
    return null;
  }, [onAdd, track]);

  const cover = useMemo(() => {
    if (withCover) {
      return <CoverArt track={track} size={48} radius={4} />;
    }
    return null;
  }, [withCover, track]);
  const tnum = useMemo(() => {
    if (withTrackNum) {
      return <div className="tracknum">{track.track_number}</div>
    }
    return null;
  }, [withTrackNum, track]);
  const artalb = useMemo(() => {
    if (withArtist || track.compilation || (track.album_artist && track.album_artist !== track.artist)) {
      return (
        <div className="artist">
          {track.artist}
          { withAlbum ? `\u00a0\u2219\u00a0${track.album}` : ''}
        </div>
      );
    }
    return null;
  }, [withArtist, withAlbum, track]);

  const updn = useMemo(() => {
    if (editing) {
      return (
        <div className="move">
          <div
            className={`fas fa-angle-up ${index === 0 ? 'disabled' : ''}`}
            onClick={() => {
              if (index > 0) {
                onMove(index, index - 1, -1);
              }
            }}
          />
          <div
            className={`fas fa-angle-down ${index >= len - 1 ? 'disabled' : ''}`}
            onClick={() => {
              if (index < len - 1) {
                onMove(index + 1, index, 1);
              }
            }}
          />
        </div>
      );
    }
    if (onAdd !== null && onAdd !== undefined) {
      return null;
    }
    return <DotsMenu track={track} onOpen={onTrackMenu} />
  }, [editing, onAdd, onMove, onTrackMenu, track, index, len]);

  return (
    <div className={`item ${editing ? 'editing' : ''}`}>
      {del}
      {add}
      {cover}
      <div className="title">
        {tnum}
        <div className="songArtistAlbum">
          <div className="song">{track.name}</div>
          {artalb}
        </div>
      </div>
      {updn}
      <style jsx>{`
        .item {
          display: flex;
          padding: 9px 9px 0px 9px;
          box-sizing: border-box;
          white-space: nowrap;
          overflow: hidden;
        }
        .item.editing {
          border-bottom: solid var(--border) 1px;
        }
        .item :global(.fa-bars) {
          line-height: 44px;
        }
        .item :global(.icon) {
          margin-top: 4px;
        }
        .title {
          flex: 10;
          display: flex;
          font-size: 18px;
          padding: 5px 0px 0px 0px;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-left: 9px;
          margin-right: 0.5em;
        }
        .title .song {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .title :global(.artist) {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 14px;
        }
        .songArtistAlbum {
          flex: 10;
          overflow: hidden;
        }
        .title :global(.tracknum) {
          flex: 1;
          width: 24px;
          min-width: 24px;
          max-width: 24px;
          margin-right: 0.5em;
          font-size: 18px;
          text-align: right;
        }
        .item :global(.move) {
          display: flex;
          flex-direction: column;
          color: var(--highlight);
        }
        .item :global(.move) .disabled {
          color: var(--text);
        }
      `}</style>
    </div>
  );
});
