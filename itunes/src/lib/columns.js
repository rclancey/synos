import moment from 'moment';

export const PLAYLIST_POSITION = {
  key: 'index',
  minWidth: 10,
  maxWidth: 10,
  label: '',
  className: 'num',
  formatter: ({ rowIndex }) => rowIndex.toString()
};

export const CHECKED = {
  key: 'disabled',
  minWidth: 10,
  maxWidth: 10,
  label: '\u2611',
  formatter: ({ rowData, dataKey }) => rowData[dataKey] ? '\u2610' : '\u2611'
};

export const TRACK_TITLE = {
  key: 'name',
  label: 'Name',
};

export const ARTIST = {
  key: 'artist',
  label: 'Artist',
};

export const COMPOSER = {
  key: 'composer',
  label: 'Composer',
};

export const ALBUM_TITLE = {
  key: 'album',
  label: 'Album',
};

export const ALBUM_ARTIST = {
  key: 'album_artist',
  label: 'Album Artist',
};

export const DISC_NUMBER = {
  key: 'disc_number',
  label: 'Disc #',
  className: 'num',
  formatter: ({ rowData }) => {
    if (rowData.disc_number) {
      if (rowData.disc_count) {
        return `${rowData.disc_number} of ${rowData.disc_count}`;
      }
      return `${rowData.disc_number}`;
    }
    return '';
  }
};

export const TRACK_NUMBER = {
  key: 'track_number',
  label: 'Track #',
  className: 'num',
  formatter: ({ rowData }) => {
    if (rowData.track_number) {
      if (rowData.track_count) {
        return `${rowData.track_number} of ${rowData.track_count}`;
      }
      return `${rowData.track_number}`;
    }
    return '';
  }
};

export const GENRE = {
  key: 'genre',
  label: 'Genre',
};

export const CATEGORY = {
  key: 'category',
  label: 'Category',
};

export const GROUPING = {
  key: 'grouping',
  label: 'Grouping',
};

const stars = (rating) => {
  let n = rating ? rating / 20 : 0;
  return [1,2,3,4,5].map(s => n >= s ? '\u2605' : '\u2606').join('');
};

export const RATING = {
  key: 'rating',
  label: 'Rating',
  className: 'stars',
  formatter: ({ rowData }) => stars(rowData.rating),
};

export const ALBUM_RATING = {
  key: 'album_rating',
  label: 'Album Rating',
  className: 'stars',
  formatter: ({ rowData }) => stars(rowData.album_rating),
};

export const RELEASE_YEAR = {
  key: 'year',
  label: 'Year',
  className: 'num',
  formatter: ({ rowData }) => {
    if (rowData.release_date) {
      return new Date(rowData.release_date).getFullYear().toString();
    }
    if (rowData.year) {
      return rowData.year.toString();
    }
    return '';
  }
};

export const displayDate = (t) => {
  if (t) {
    return moment(t).format('M/D/YYYY');
  }
  return '';
};

export const displayTime = (t) => {
  if (t) {
    const h = Math.floor(t / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    let d = '';
    if (h > 0) {
      d += `${h}:`;
      if (m >= 10) {
        d += `${m}:`;
      } else {
        d += `0${m}:`;
      }
    } else {
      d = `${m}:`;
    }
    if (s >= 10) {
      d += `${s}`;
    } else {
      d += `0${s}`;
    }
    return d;
  }
  return '0:00';
};

export const displayDateTime = (t) => {
  if (t) {
    return moment(t).format('M/D/YYYY, h:mm A');
  }
  return '';
};

export const RELEASE_DATE = {
  key: 'release_date',
  label: 'Release Date',
  className: 'date',
  formatter: ({ rowData }) => displayDate(rowData.release_date),
};

export const DATE_ADDED = {
  key: 'date_added',
  label: 'Date Added',
  className: 'date',
  formatter: ({ rowData }) => displayDateTime(rowData.date_added),
};

export const DATE_MODIFIED = {
  key: 'date_modified',
  label: 'Date Modified',
  className: 'date',
  formatter: ({ rowData }) => displayDateTime(rowData.date_modified),
};

export const PURCHASE_DATE = {
  key: 'purchase_date',
  label: 'Purchase Date',
  className: 'date',
  formatter: ({ rowData }) => displayDateTime(rowData.purchase_date),
};

export const LAST_PLAYED = {
  key: 'play_date_utc',
  label: 'Last Played',
  className: 'date',
  formatter: ({ rowData }) => displayDateTime(rowData.play_date_utc),
};

export const LAST_SKIPPED = {
  key: 'skip_date',
  label: 'Last Skipped',
  className: 'date',
  formatter: ({ rowData }) => displayDateTime(rowData.skip_date),
};

export const PLAY_COUNT = {
  key: 'play_count',
  label: 'Plays',
  className: 'num',
};

export const SKIP_COUNT = {
  key: 'skip_count',
  label: 'Skips',
  className: 'num',
};

export const TIME = {
  key: 'total_time',
  label: 'Time',
  className: 'time',
  formatter: ({ rowData }) => displayTime(rowData.total_time),
};

export const KIND = {
  key: 'kind',
  label: 'Kind',
};

export const BEATS_PER_MINUTE = {
  key: 'bpm',
  label: 'Beats per Minute',
  className: 'num',
};

export const BIT_RATE = {
  key: 'bit_rate',
  label: 'Bit Rate',
  className: 'num',
};

