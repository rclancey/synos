export const SHUFFLE = 1;
export const REPEAT = 2;

export class APIBase {
  constructor(onLoginRequired) {
    this.onLoginRequired = onLoginRequired;
  }

  fetch(url, xargs) {
    const args = Object.assign({}, xargs);
    if (!args.method) {
      if (args.body) {
        args.method = 'POST';
      } else {
        args.method = 'GET';
      }
    }
    args.credientials = 'include';
    if (args.body) {
      if (!args.headers) {
        args.headers = {};
      }
      if (!args.headers['Content-Type']) {
        args.headers['Content-Type'] = 'application/json';
      }
      if (typeof args.body !== 'string') {
        args.body = JSON.stringify(args.body);
      }
    }
    return fetch(url, args)
      .then(resp => {
        if (resp.status === 401 && this.onLoginRequired) {
          this.onLoginRequired();
          throw new Error(resp.status.toString());
        }
        if (resp.status === 204) {
          return null;
        }
        if (resp.status !== 200) {
          throw new Error(resp.status.toString());
        }
        return resp.json();
      });
  }

  get(url) {
    const method = 'GET';
    return this.fetch(url, { method });
  }

  post(url, body, args) {
    const method = 'POST';
    return this.fetch(url, Object.assign({}, args, { method, body }));
  }

  put(url, body, args) {
    const method = 'PUT';
    return this.fetch(url, Object.assign({}, args, { method, body }));
  }

  patch(url, body, args) {
    const method = 'PATCH';
    return this.fetch(url, Object.assign({}, args, { method, body }));
  }

  delete(url) {
    const method = 'DELETE';
    return this.fetch(url, { method });
  }

}

export class API extends APIBase {
  loadTracks(page, count, since, args) {
    let url = `/api/tracks?page=${page}&count=${count}&since=${since}`;
    if (args) {
      url += Object.entries(args)
        .map(entry => `&${escape(entry[0])}=${escape(entry[1])}`)
        .join('');
    }
    return this.get(url);
  }

  loadTrackCount(since) {
    const url = `/api/tracks/count?since=${since}`;
    return this.get(url);
  };

  loadPlaylists(folderId) {
    let url = `/api/playlists`;
    if (folderId !== undefined && folderId !== null) {
      url += `/${folderId}`;
    }
    return this.get(url);
  };

  loadPlaylistTrackIds(pl) {
    const url = `/api/playlist/${pl.persistent_id}/track-ids`;
    return this.get(url);
  }

  createPlaylist(playlist) {
    const url = '/api/playlist';
    return this.post(url, playlist);
  }

  makeGenius(trackIds) {
    const items = trackIds.map((id) => `trackId=${id}`).join('&');
    const url = `/api/genius/tracks?${items}`;
    return this.get(url);
  }

  makeGeniusMix(genre, args) {
    const url = `/api/genius/mix/${genre}`;
    return this.post(url, args);
  }

  makeArtistMix(artist, args) {
    const params = new URLSearchParams({ artist });
    if (args !== null && args !== undefined) {
      Object.entries(args).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, val);
        }
      });
    }
    const url = `/api/genius/artists?${params.toString()}`
    return this.get(url);
  }

  listGeniusGenres() {
    const url = `/api/genius/genres`;
    return this.get(url);
  }

  addToPlaylist(dst, tracks) {
    //const playlist = Object.assign({}, dst);
    const url = `/api/playlist/${dst.persistent_id}`;
    const body = tracks.map(track => ({ persistent_id: track.persistent_id }));
    return this.patch(url, body)
      .then(pl => pl.track_ids);
  };

  reorderTracks(playlist, targetIndex, sourceIndices) {
    const srcIdx = new Set(sourceIndices);
    const before = playlist.items.slice(0, targetIndex).filter((tr, i) => !srcIdx.has(i));
    const after = playlist.items.slice(targetIndex).filter((tr, i) => !srcIdx.has(i + targetIndex));
    const middle = playlist.items.filter((tr, i) => srcIdx.has(i));
    const newTracks = before.concat(middle).concat(after);
    /*
    const target = playlist.tracks[targetIndex];
    const sources = sourceIndices.map(i => playlist.tracks[i]);
    const tracks = playlist.tracks.filter((t, i) => !sourceIndices.includes(i));
    const newIdx = tracks.findIndex(t => t === target);
    const before = newIdx === -1 ? [] : tracks.slice(0, newIdx+1);
    const after = newIdx === -1 ? tracks.slice(0) : tracks.slice(newIdx+1);
    const newTracks = before.concat(sources).concat(after);
    */
    console.debug('move %o to %o (%o => %o)', sourceIndices, targetIndex, playlist.items.map(tr => tr.persistent_id), newTracks.map(tr => tr.persistent_id));
    const url = `/api/playlist/${playlist.persistent_id}/tracks`;
    const body = newTracks.map(track => ({ persistent_id: track.persistent_id }));
    return this.put(url, body)
      .then(pl => pl.track_ids);
  }

  deletePlaylistTracks(playlist, selected) {
    console.debug('delete %o from %o', selected, playlist);
    const delIdx = new Set(selected.map(s => s.track.origIndex));
    const newTracks = playlist.items.filter((track, i) => !delIdx.has(i));
    //const newTracks = playlist.tracks.filter(track => !selected[track.persistent_id]);
    const url = `/api/playlist/${playlist.persistent_id}/tracks`;
    const body = newTracks.map(track => ({ persistent_id: track.persistent_id }));
    console.debug('tracks after deleting: %o', newTracks);
    return this.put(url, body)
      .then(pl => pl.track_ids);
  }

  movePlaylist(playlist, folder) {
    const url = `/api/playlist/${playlist.persistent_id}`;
    const body = Object.assign({}, playlist, { parent_persistent_id: folder ? folder.persistent_id : null });
    return this.put(url, body);
  }

  sharePlaylist(playlistId) {
    const url = `/api/shared/${playlistId}`;
    return this.put(url);
  }

  unsharePlaylist(playlistId) {
    const url = `/api/shared/${playlistId}`;
    return this.delete(url);
  }

  loadRecent() {
    const url = '/api/recents';
    return this.get(url);
  }

  loadGenres() {
    const url = '/api/index/genres';
    return this.get(url);
  }

  loadPlaylist(id) {
    const url = `/api/playlist/${id}`;
    return this.get(url);
  }

  loadPlaylistTracks(playlist) {
    const url = `/api/playlist/${playlist.persistent_id}/tracks`;
    return this.get(url);
  }

  loadAlbumTracks(album) {
    const url = `/api/index/songs/artist=${escape(album.artist.sort)}&album=${escape(album.sort)}`;
    return this.get(url);
  }

  loadArtists(genre) {
    let url = `/api/index/artists`;
    if (genre) {
      url += `?genre=${escape(genre.sort)}`;
    }
    return this.get(url);
  }

  getArtist(name) {
    const url = `/api/index/artists/${name}`;
    return this.get(url);
  }

  getAlbum(artist, album) {
    const url = `/api/index/albums/${artist}/${album}`;
    return this.get(url);
  }

  constructSearchQuery({ query, genre, song, album, artist, count = 100, page = 0 }) {
    let q = `?count=${count}&page=${page}`;

    if (query) {
      q += `&q=${escape(query)}`;
    } else {
      let ok = false;
      if (genre) {
        q += `&genre=${escape(genre)}`;
      }
      if (song) {
        q += `&song=${escape(song)}`;
        ok = true;
      }
      if (album) {
        q += `&album=${escape(album)}`;
        ok = true;
      }
      if (artist) {
        q += `&artist=${escape(artist)}`;
        ok = true;
      }
      if (!ok) {
        throw new Error("no query specified");
      }
    }
    return q;
  }

  search(args) {
    try {
      const url = `/api/tracks/search?${this.constructSearchQuery(args)}`;
      return this.get(url);
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  searchArtists(args) {
    try {
      const url = `/api/search/artists?${this.constructSearchQuery(args)}`;
      return this.get(url)
        .then(res => {
          return res.map(art => {
            const n = art.names ? Object.values(art.names).reduce((sum, v) => sum + v) : 0;
            return Object.assign({}, art, { count: n });
          })
            .sort((a, b) => a.count > b.count ? -1 : a.count < b.count ? 1 : 0);
        });
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  searchAlbums(args) {
    try {
      const url = `/api/search/albums?${this.constructSearchQuery(args)}`;
      return this.get(url)
        .then(res => {
          return res.map(alb => {
            const n = alb.names ? Object.values(alb.names).reduce((sum, v) => sum + v) : 0;
            return Object.assign({}, alb, { count: n });
          })
            .sort((a, b) => a.count > b.count ? -1 : a.count < b.count ? 1 : 0);
        });
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  genreIndex() {
    const url = '/api/index/genres';
    return this.get(url);
  }

  artistIndex(genre) {
    let url = '/api/index/artists';
    if (genre) {
      url += `?genre=${escape(genre)}`;
    }
    return this.get(url);
  }

  albumIndex(artist) {
    let url = '/api/index/';
    if (artist) {
      url += `albums?artist=${escape(artist)}`;
    } else {
      url += 'album-artist';
    }
    return this.get(url);
  }

  songIndex(album) {
    const url = `/api/index/songs?artist=${escape(album.artist.sort)}&album=${escape(album.sort)}`;
    return this.get(url);
  }

  loadAlbums(artist) {
    let url = `/api/index/`;
    if (artist) {
      url += `albums?artist=${escape(artist.sort)}`;
    } else {
      url += `album-artist`;
    }
    return this.get(url);
  }

  updateTrack(updated) {
    const url = `/api/track/${updated.persistent_id}`;
    return this.put(url, updated);
  }

  updateTracks(tracks, update) {
    const url = `/api/tracks`;
    const body = {
      track_ids: tracks.map(tr => tr.persistent_id),
      update,
    };
    console.debug('PUT %o %o', url, body);
    return this.put(url, body);
  }

  queueManip(method, tracks) {
    const url = `/api/sonos/queue`;
    const args = { method };
    if (tracks !== undefined && tracks !== null) {
      args.body = tracks.map(track => track.persistent_id);
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
    return this.post(url);
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
      args.body = val;
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

  listUsers() {
    return this.get('/api/admin/users');
  }

  getUser(username) {
    return this.get(`/api/admin/user/${username}`);
  }

  editUser(user) {
    return this.put(`/api/admin/user/${user.username}`, user);
  }

  createUser(user) {
    return this.post('/api/admin/user', user);
  }

  deleteUser(username) {
    return this.delete(`/api/admin/user/${username}`);
  }

}

