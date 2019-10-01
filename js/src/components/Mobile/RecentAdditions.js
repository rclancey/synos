import React, { useState, useMemo, useEffect } from 'react';
import { useAPI } from '../../lib/useAPI';
import { API } from '../../lib/api';
import { SongList, PlaylistTitle } from './SongList';
import { MixCover } from './MixCover';

export const RecentAdditions = ({
  prev,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
}) => {
  const api = useAPI(API);
  const [recents, setRecents] = useState([]);
  useEffect(() => {
    api.loadTrackCount(0)
      .then(count => api.loadTracks(1, count, 0, { date_added: Date.now() - (366 * 86400 * 1000) }))
      .then(tracks => {
        tracks.sort((a, b) => {
          return a.date_added < b.date_added ? 1 : a.date_added > b.date_added ? -1 : 0;
        });
        setRecents(tracks);
      });
  }, []);

  return (
    <SongList
      prev={prev}
      tracks={recents}
      withTrackNum={false}
      withCover={true}
      withArtist={true}
      withAlbum={true}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
    >
      <MixCover tracks={recents} radius={5} />
      <PlaylistTitle
        tracks={recents}
        playlist={{ name: 'Recent Additions' }}
        onPlaylistMenu={onPlaylistMenu}
      />
    </SongList>
  );
};
