import displayTime from './displayTime';

export const PLAYLIST_POSITION = {
  key: 'origIndex',
  minWidth: 30,
  maxWidth: 50,
  width: 50,
  label: '#',
  className: 'num',
  formatter: ({ rowData }) => (rowData.origIndex + 1).toString()
};

export const CHECKED = {
  key: 'disabled',
  minWidth: 10,
  maxWidth: 10,
  width: 10,
  label: '\u2611',
  formatter: ({ rowData, dataKey }) => rowData[dataKey] ? '\u2610' : '\u2611'
};

export const TRACK_TITLE = {
  key: 'name',
  label: 'Name',
  width: 200,
};

export const ARTIST = {
  key: 'artist',
  label: 'Artist',
  width: 150,
};

export const COMPOSER = {
  key: 'composer',
  label: 'Composer',
  width: 150,
};

export const ALBUM_TITLE = {
  key: 'album',
  label: 'Album',
  width: 150,
};

export const ALBUM_ARTIST = {
  key: 'album_artist',
  label: 'Album Artist',
  width: 150,
};

export const DISC_NUMBER = {
  key: 'disc_number',
  label: 'Disc #',
  className: 'num',
  maxWidth: 55,
  width: 55,
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
  maxWidth: 65,
  width: 65,
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
  width: 100,
};

export const CATEGORY = {
  key: 'category',
  label: 'Category',
  width: 100,
};

export const GROUPING = {
  key: 'grouping',
  label: 'Grouping',
  width: 100,
};

const stars = (rating) => {
  let n = rating ? rating / 20 : 0;
  return [1,2,3,4,5].map(s => n >= s ? '\u2605' : '\u2606').join('');
};

export const RATING = {
  key: 'rating',
  label: 'Rating',
  className: 'stars',
  maxWidth: 80,
  width: 80,
  formatter: ({ rowData }) => stars(rowData.rating),
};

export const ALBUM_RATING = {
  key: 'album_rating',
  label: 'Album Rating',
  className: 'stars',
  maxWidth: 80,
  width: 80,
  formatter: ({ rowData }) => stars(rowData.album_rating),
};

export const RELEASE_YEAR = {
  key: 'year',
  label: 'Year',
  className: 'num',
  maxWidth: 75,
  width: 75,
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
    const dt = new Date(t);
    return (dt.getMonth() + 1) + '/' + dt.getDate() + '/' + dt.getFullYear();
    //return moment(t).format('M/D/YYYY');
  }
  return '';
};

export const displayDateTime = (t) => {
  if (t) {
    const dt = new Date(t);
    let ap = '';
    let h = dt.getHours();
    if (h === 0) {
      h = '12';
      ap = 'AM';
    } else if (h < 12) {
      h = h.toString();
      ap = 'AM';
    } else if (h === 12) {
      h = '12';
      ap = 'PM';
    } else {
      h = (h - 12).toString();
      ap = 'PM';
    }
    let m = dt.getMinutes().toString();
    if (m < 10) {
      m = '0' + m.toString();
    } else {
      m = m.toString();
    }
    return (dt.getMonth() + 1) + '/' + dt.getDate() + '/' + dt.getFullYear() + ', ' + h + ':' + m + ' ' + ap;
    //return moment(t).format('M/D/YYYY, h:mm A');
  }
  return '';
};

export const RELEASE_DATE = {
  key: 'release_date',
  label: 'Release Date',
  className: 'date',
  maxWidth: 100,
  width: 100,
  formatter: ({ rowData }) => displayDate(rowData.release_date),
};

export const DATE_ADDED = {
  key: 'date_added',
  label: 'Date Added',
  className: 'date',
  maxWidth: 132,
  width: 132,
  formatter: ({ rowData }) => displayDateTime(rowData.date_added),
};

export const DATE_MODIFIED = {
  key: 'date_modified',
  label: 'Date Modified',
  className: 'date',
  maxWidth: 132,
  width: 132,
  formatter: ({ rowData }) => displayDateTime(rowData.date_modified),
};

export const PURCHASE_DATE = {
  key: 'purchase_date',
  label: 'Purchase Date',
  className: 'date',
  maxWidth: 132,
  width: 132,
  formatter: ({ rowData }) => displayDateTime(rowData.purchase_date),
};

export const LAST_PLAYED = {
  key: 'play_date',
  label: 'Last Played',
  className: 'date',
  maxWidth: 132,
  width: 132,
  formatter: ({ rowData }) => displayDateTime(rowData.play_date),
};

export const LAST_SKIPPED = {
  key: 'skip_date',
  label: 'Last Skipped',
  className: 'date',
  maxWidth: 132,
  width: 132,
  formatter: ({ rowData }) => displayDateTime(rowData.skip_date),
};

export const PLAY_COUNT = {
  key: 'play_count',
  label: 'Plays',
  className: 'num',
  maxWidth: 75,
  width: 75,
};

export const SKIP_COUNT = {
  key: 'skip_count',
  label: 'Skips',
  className: 'num',
  maxWidth: 75,
  width: 75,
};

export const TIME = {
  key: 'total_time',
  label: 'Time',
  className: 'time',
  maxWidth: 60,
  width: 60,
  formatter: ({ rowData }) => displayTime(rowData.total_time),
};

export const KIND = {
  key: 'kind',
  label: 'Kind',
  width: 100,
};

export const BEATS_PER_MINUTE = {
  key: 'bpm',
  label: 'Beats per Minute',
  className: 'num',
  maxWidth: 75,
  width: 75,
};

export const BIT_RATE = {
  key: 'bit_rate',
  label: 'Bit Rate',
  className: 'num',
  maxWidth: 75,
  width: 75,
};

export const EMPTY = {
  key: null,
  label: '',
  className: 'empty',
  minWidth: 1,
  formatter: ({ rowData }) => '',
};

