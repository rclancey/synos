import React from 'react';
import { Folder } from '../../Playlists/Folder';
import { JookiTrackBrowser } from './TrackBrowser';
import { JookiDevice } from './Device';
import { jookiTokenImgUrl } from './Token';

export const JookiDevicePlaylist = ({
  device,
  selected,
  onSelect,
}) => {
  if (!device) {
    return null;
  }
  const playlist = {
    kind: 'device',
    folder: true,
    children: device.playlists
      .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
      .map(pl => Object.assign({}, pl, { icon: pl.token ? jookiTokenImgUrl(pl.token) : null }))
  };
  const onRename = (pl, name) => {
    console.debug('rename jooki playlist %o to %o', pl, name);
  };
  const onMovePlaylist = ({ source, target }) => {
    console.debug('onMovePlaylist(%o)', { source, target });
    if (source.device === 'itunes') {
      device.api.copyPlaylist(source.playlist);
    }
  };
  const onAddToPlaylist = ({ source, target }) => {
    console.debug('onAddToPlaylist(%o)', { source, target });
  };
  return (
    <Folder
      depth={0}
      indentPixels={12}
      device="jooki"
      playlist={playlist}
      icon="/jooki.png"
      name="Jooki"
      selected={selected}
      onSelect={pl => {
        if (pl === playlist) {
          onSelect(pl, <JookiDevice device={device} />);
        } else {
          onSelect(pl, <JookiTrackBrowser device={device} playlist={pl} />);
        }
      }}
      onRename={onRename}
      onMovePlaylist={onMovePlaylist}
      onAddToPlaylist={onAddToPlaylist}
      canDrop={(type, item, monitor) => {
        return type === 'Playlist';
      }}
      onDrop={(type, item, monitor) => {
        console.debug('dropping %o %o on jooki', type, item);
      }}
    />
  );
  /*
      { device.playlists
        .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
        .map(pl => (
          <PlaylistRow
            key={pl.persistent_id}
            depth={1}
            indentPixels={12}
            icon={pl.token ? jookiTokenImgUrl(pl.token) : null}
            name={pl.name}
            selected={selected === pl.persistent_id}
            onSelect={() => onSelect(pl, <JookiTrackBrowser device={device} playlist={pl} />)}
            canDrop={(type, item, monitor) => {
              return type === 'Playlist' || type === 'Track';
            }}
            onDrop={(type, item, monitor) => {
              console.debug('dropping %o %o on jooki playlist %o', type, item, pl);
            }}
          />
        )) }
    </Folder>
  );
  */
};
