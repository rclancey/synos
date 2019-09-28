import { APIBase } from './api';

export class SonosAPI extends APIBase {
  constructor(onLoginRequired) {
    super(onLoginRequired);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.skipTo = this.skipTo.bind(this);
    this.skipBy = this.skipBy.bind(this);
    this.seekTo = this.seekTo.bind(this);
    this.seekBy = this.seekBy.bind(this);
    this.replaceQueue = this.replaceQueue.bind(this);
    this.appendToQueue = this.appendToQueue.bind(this);
    this.insertIntoQueue = this.insertIntoQueue.bind(this);
    this.setPlaylist = this.setPlaylist.bind(this);
    this.setVolumeTo = this.setVolumeTo.bind(this);
    this.changeVolumeBy = this.changeVolumeBy.bind(this);
    this.getQueue = this.getQueue.bind(this);
  }

  queueManip(method, tracks) {
    const url = `/api/sonos/queue`;
    const args = { method };
    if (tracks !== undefined && tracks !== null) {
      args.body = tracks.map(track => track.persistent_id);
    }
    return this.fetch(url, args);
  }

  getQueue() {
    return this.queueManip('GET');
  }

  setPlaylist(id, index) {
    let url = `/api/sonos/queue?playlist=${id}`;
    if (index) {
      url += `&index=${index}`;
    }
    return this.post(url);
  }

  replaceQueue(tracks) {
    return this.queueManip('POST', tracks);
  }

  insertIntoQueue(tracks) {
    return this.queueManip('PATCH', tracks);
  }

  appendToQueue(tracks) {
    return this.queueManip('PUT', tracks);
  }

  stateManip(action) {
    const url = `/api/sonos/${action}`;
    return this.post(url);
  }

  play() {
    return this.stateManip('play');
  }

  pause() {
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

  seekTo(ms) {
    return this.posManip('seek', 'POST', Math.round(ms));
  }

  seekBy(ms) {
    return this.posManip('seek', 'PUT', Math.round(ms));
  }

  skipTo(idx) {
    return this.posManip('skip', 'POST', idx);
  }

  skipBy(count) {
    return this.posManip('skip', 'PUT', count);
  }

  getVolume() {
    return this.posManip('volume', 'GET');
  }

  setVolumeTo(vol) {
    return this.posManip('volume', 'POST', Math.round(vol));
  }

  changeVolumeBy(delta) {
    return this.posManip('volume', 'PUT', Math.round(delta));
  }
}
