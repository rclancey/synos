import React, { useEffect } from 'react';
import _JSXStyle from "styled-jsx/style";
import { TrackBrowser } from '../../Tracks/TrackBrowser.js';
import * as COLUMNS from '../../../../lib/columns';
import { useControlAPI } from '../../../Player/Context';

const defaultColumns = [
  Object.assign({}, COLUMNS.PLAYLIST_POSITION, { width: 100 /*1*/ }),
  Object.assign({}, COLUMNS.TRACK_TITLE,       { width: 11 /*15*/ }),
  Object.assign({}, COLUMNS.TIME,              { width: 100 /*3*/ }),
  Object.assign({}, COLUMNS.ARTIST,            { width: 11 /*10*/ }),
  Object.assign({}, COLUMNS.ALBUM_TITLE,       { width: 11 /*12*/ }),
  Object.assign({}, COLUMNS.EMPTY,             { width: 1 }),
];

export const JookiTrackBrowser = ({
  api,
  playlist,
  search,
  setPlayer,
}) => {
  const controlAPI = useControlAPI();
  //const [playbackInfo, setPlaybackInfo] = useState({});
  //const [controlAPI, setControlAPI] = useState({});

  const onDelete = (pl, tracks) => {
    console.debug('jooki %o onDelete(%o)', playlist, tracks);
    return api.deletePlaylistTracks(playlist, tracks);
  };
  const onReorder = (pl, index, tracks) => {
    console.debug('jooki %o onReorder(%o)', playlist, { pl, index, tracks });
    return api.reorderTracks(pl, index, tracks);
  };

  useEffect(() => {
    setPlayer('jooki');
    return () => {
      setPlayer(null);
    };
  }, [setPlayer]);

  return (
    <div className="jookiPlaylist">
      {/*
      <JookiPlayer
        setTiming={() => {}}
        setPlaybackInfo={setPlaybackInfo}
        setControlAPI={setControlAPI}
      />
      */}
      {/*
      <JookiPlaylistHeader
        playlist={playlist}
        playbackInfo={playbackInfo}
        controlAPI={controlAPI}
      />
      */}
      <TrackBrowser
        columnBrowser={false}
        columns={defaultColumns}
        tracks={playlist ? playlist.tracks : []}
        playlist={playlist}
        search={search}
        onDelete={onDelete}
        onReorder={onReorder}
        controlAPI={controlAPI}
      />
      <style jsx>{`
        .jookiPlaylist {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

