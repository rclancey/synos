import React from 'react';
import { Grid, GridRow, GridSpacer } from './Layout';
import { TimeInput, RangeInput, Updated } from './Inputs';

export const Options = ({
  track,
  updated,
  onChange,
  onReset,
}) => {
  return (
    <Grid>
      <GridRow label="media kind">
        <select value={track.media_kind || ''} onChange={evt => onChange({ media_kind: evt.target.value })}>
          <option value="music">Music</option>
          <option value="movie">Movie</option>
          <option value="podcast">Podcast</option>
          <option value="audiobook">Audiobook</option>
          <option value="music_video">Music Video</option>
          <option value="tv_show">TV Show</option>
          <option value="home_video">Home Video</option>
          <option value="voice_memo">Voice Memo</option>
          <option value="book">Book</option>
        </select>
        <Updated updated={updated} field="media_kind" onReset={onReset} />
      </GridRow>

      {updated ? null : (<>
        <GridSpacer />
        <GridRow label="start">
          <TimeInput
            value={track.start_time}
            max={track.total_time}
            placeholder={0}
            onChange={t => onChange({ start_time: t })}
          />
        </GridRow>
        <GridRow label="end">
          <TimeInput
            value={track.end_time}
            max={track.total_time}
            placeholder={track.total_time}
            onChange={t => onChange({ end_time: t })}
          />
        </GridRow>
      </>)}

      <GridSpacer />
      <GridRow label="volume adjust">
        <RangeInput
          value={track.volume_adjustment}
          onChange={v => onChange({ volume_adjustment: v })}
        />
        <Updated updated={updated} field="volume_adjustment" onReset={onReset} />
      </GridRow>
    </Grid>
  );
};
