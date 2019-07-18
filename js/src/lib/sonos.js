const queueManip = (method, tracks) => {
  const options = { method };
  if (tracks !== undefined && tracks !== null) {
    options.body = JSON.stringify(tracks.map(track => track.persistent_id));
    options.headers = { 'Content-Type': 'application/json' };
  }
  return fetch('/api/sonos/queue', options)
    .then(resp => resp.json());
};

export const getSonosQueue = () => queueManip('GET');
export const replaceSonosQueue = tracks => queueManip('POST', tracks);
export const insertIntoSonosQueue = tracks => queueManip('PATCH', tracks);
export const appendToSonosQueue = tracks => queueManip('PUT', tracks);

const stateManip = action => {
  const uri = `/api/sonos/${action}`;
  return fetch(uri, { method: 'POST' })
    .then(resp => resp.json());
};

export const playSonos = () => stateManip('play');
export const pauseSonos = () => stateManip('pause');

const posManip = (action, method, val) => {
  const uri = `/api/sonos/${action}`;
  const options = { method };
  if (val !== undefined && val !== null) {
    options.body = JSON.stringify(val);
    options.headers = { 'Content-Type': 'application/json' };
  }
  return fetch(uri, options)
    .then(resp => resp.json());
};

export const seekSonosTo = ms => posManip('seek', 'POST', Math.round(ms));
export const seekSonosBy = ms => posManip('seek', 'PUT', Math.round(ms));
export const skipSonosTo = idx => posManip('skip', 'POST', idx);
export const skipSonosBy = count => posManip('skip', 'PUT', count);

export const getSonosVolume = () => posManip('volume', 'GET');
export const setSonosVolumeTo = vol => posManip('volume', 'POST', Math.round(vol));
export const changeSonosVolumeBy = vol => posManip('volume', 'PUT', Math.round(vol));
