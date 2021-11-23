import React, { useEffect} from 'react';

import { useJooki } from '../../../../lib/jooki';
import { Folder } from '../../Playlists/Folder';
import { JookiTrackBrowser } from './TrackBrowser';
import { JookiDevice } from './Device';
import { jookiTokenImgUrl } from '../../../Jooki/Token';

export const JookiDevicePlaylist = ({
  selected,
  onSelect,
  setPlayer,
}) => {
  const device = useJooki();
  const dpls = device ? device.playlists : null;
  const api = device ? device.api : null;
  useEffect(() => {
    if (!dpls) {
      return;
    }
    if (!selected) {
      return;
    }
    const pl = dpls.find(x => x.persistent_id === selected);
    if (pl) {
      onSelect(pl, <JookiTrackBrowser api={api} playlist={pl} setPlayer={setPlayer} />);
    }
  }, [api, dpls, selected, onSelect, setPlayer]);
  if (!device) {
    return null;
  }
  const playlist = {
    kind: 'device',
    folder: true,
    children: (device.playlists || [])
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
    if (source.type === 'TrackList') {
      device.api.addToPlaylist(target.playlist, source.tracks.map(tr => tr.track));
    }
  };
  if (!device || !device.state) {
    return null;
  }
  return (
    <Folder
      to="/device/jooki"
      exact
      link
      depth={0}
      indentPixels={12}
      device="jooki"
      playlist={playlist}
      icon="/assets/icons/jooki.png"
      name="Jooki"
      selected={selected}
      onSelect={pl => {
        if (pl === playlist) {
          onSelect(pl, <JookiDevice device={device} setPlayer={setPlayer} />);
        } else {
          onSelect(pl, <JookiTrackBrowser api={api} playlist={pl} setPlayer={setPlayer} />);
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
