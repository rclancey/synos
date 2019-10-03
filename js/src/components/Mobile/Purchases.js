import React, { useState, useEffect } from 'react';
import { useAPI } from '../../lib/useAPI';
import { API } from '../../lib/api';
import { SongList, PlaylistTitle } from './SongList';
import { MixCover } from './MixCover';

export const Purchases = ({
  prev,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
}) => {
  const api = useAPI(API);
  const [purchases, setPurchases] = useState([]);
  useEffect(() => {
    api.loadTrackCount(0)
      .then(count => api.loadTracks(1, count, 0, { purchased: true }))
      .then(tracks => {
        tracks.sort((a, b) => {
          return a.date_added < b.date_added ? 1 : a.date_added > b.date_added ? -1 : 0;
        });
        setPurchases(tracks);
      });
  }, [api, setPurchases]);

  return (
    <SongList
      prev={prev}
      tracks={purchases}
      withTrackNum={false}
      withCover={true}
      withArtist={true}
      withAlbum={true}
      onClose={onClose}
      onTrackMenu={onTrackMenu}
    >
      <MixCover tracks={purchases} radius={5} />
      <PlaylistTitle
        tracks={purchases}
        playlist={{ name: 'Purchased Music' }}
        onPlaylistMenu={onPlaylistMenu}
      />
    </SongList>
  );
};

