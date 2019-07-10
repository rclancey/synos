export class API {
  constructor(onLoginRequired) {
    this.onLoginRequired = onLoginRequired;
  }

  fetch(url, args) {
    args.credientials = 'include';
    return fetch(url, args)
      .then(resp => {
        if (resp.status == 401) {
          this.onLoginRequired();
          throw new Error(resp.status.toString());
        }
        if (resp.status !== 200) {
          throw new Error(resp.status.toString());
        }
        return resp.json();
      });
  }

  loadTracks(page, count, since) {
    const url = `/api/tracks?page=${page}&count=${count}&since=${since}`;
    return this.fetch(url, { method: 'GET' });
  }

  loadTrackCount(since) {
    const url = `/api/tracks/count?since=${since}`;
    return this.fetch(url, { method: 'GET' });
  };

  loadPlaylists() {
    const url = `/api/playlists`;
    return this.fetch(url, { method: 'GET' });
  };

  loadPlaylistTrackIds(pl) {
    const url = `/api/playlist/${pl.persistent_id}/track-ids`;
    return this.fetch(url, { method: 'GET' });
  }

  addToPlaylist(dst, tracks) {
    const playlist = Object.assign({}, dst);
    const url = `/api/playlist/${dst.persistent_id}`;
    const args = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tracks.map(track => { return { persistent_id: track.persistent_id }; })),
    };
    return this.fetch(url, args)
      .then(pl => pl.track_ids);
  };

  reorderTracks(playlist, targetIndex, sourceIndices) {
    const target = playlist.tracks[targetIndex];
    const sources = sourceIndices.map(i => playlist.tracks[i]);
    const tracks = playlist.tracks.filter((t, i) => !sourceIndices.includes(i));
    const newIdx = tracks.findIndex(t => t === target);
    const before = newIdx === -1 ? [] : tracks.slice(0, newIdx+1);
    const after = newIdx === -1 ? tracks.slice(0) : tracks.slice(newIdx+1);
    const newTracks = before.concat(sources).concat(after);
    const url = `/api/playlist/${playlist.persistent_id}?replace=true`;
    const args = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newTracks.map(track => { return { persistent_id: track.persistent_id }; })),
    };
    return this.fetch(url, args)
      .then(pl => pl.track_ids);
  }

  deletePlaylistTracks(playlist, selected) {
    const newTracks = playlist.tracks.filter(track => !selected[track.persistent_id]);
    const url = `/api/playlist/${playlist.persistent_id}?replace=true`;
    const args = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newTracks.map(track => { return { persistent_id: track.persistent_id }; })),
    };
    return this.fetch(url, args)
      .then(pl => pl.track_ids);
  }

  loadGenres() {
    const url = '/api/index/genres';
    return this.fetch(url, { method: 'GET' });
  }

  loadPlaylistTracks(playlist) {
    const url = `/api/playlist/${playlist.persistent_id}/tracks`;
    const args = { method: 'GET' };
    return this.fetch(url, args);
  }

  loadAlbumTracks(album) {
    const url = `/api/index/songs/artist=${escape(album.artist.sort)}&album=${escape(album.sort)}`;
    const args = { method: 'GET' };
    return this.fetch(url, args);
  }

  loadArtists(genre) {
    let url = `/api/index/artists`;
    if (genre) {
      url += `?genre=${escape(genre.sort)}`;
    }
    const args = { method: 'GET' };
    return this.fetch(url, args);
  }

  loadAlbums(artist) {
    let url = `/api/index/`;
    if (artist) {
      url += `albums?artist=${escape(artist.sort)}`;
    } else {
      url += `album-artist`;
    }
    const args = { method: 'GET' };
    return this.fetch(url, args);
  }

  queueManip(method, tracks) {
    const url = `/api/sonos/queue`;
    const args = { method };
    if (tracks !== undefined && tracks !== null) {
      args.body = JSON.stringify(tracks.map(track => track.persistent_id));
      args.headers = { 'Content-Type': 'application/json' };
    }
    return this.fetch(url, args);
  }    
      
  getSonosQueue() {
    return this.queueManip('GET');
  }

  replaceSonosQueue(tracks) {
    return this.queueManip('POST', tracks);
  }

  insertIntoSonosQueue(tracks) {
    return this.queueManip('PATCH', tracks);
  }

  appendToSonosQueue(tracks) {
    return this.queueManip('PUT', tracks);
  }

  stateManip(action) {
    const url = `/api/sonos/${action}`;
    const args = { method: 'POST' };
    return this.fetch(url, args);
  }

  playSonos() {
    return this.stateManip('play');
  }

  pauseSonos() {
    return this.stateManip('pause');
  }

  posManip(action, method, val) {
    const url = `/api/sonos/${action}`;
    const args = { method };
    if (val !== undefined && val !== null) {
      args.body = JSON.stringify(val);
      args.headers = { 'Content-Type': 'application/json' };
    }   
    return this.fetch(url, args);
  }  

  seekSonosTo(ms) {
    return this.posManip('seek', 'POST', Math.round(ms));
  }

  seekSonosBy(ms) {
    return this.posManip('seek', 'PUT', Math.round(ms));
  }

  skipSonosTo(idx) {
    return this.posManip('skip', 'POST', idx);
  }

  skipSonosBy(count) {
    return this.posManip('skip', 'PUT', count);
  }

  getSonosVolume() {
    return this.posManip('volume', 'GET');
  }

  setSonosVolumeTo(vol) {
    return this.posManip('volume', 'POST', Math.round(vol));
  }

  changeSonosVolumeBy(delta) {
    return this.posManip('volume', 'PUT', Math.round(delta));
  }

}

