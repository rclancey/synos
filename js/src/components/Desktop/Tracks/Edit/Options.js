import React, { useCallback } from 'react';

import MenuInput from '../../../Input/MenuInput';
import { Grid, GridRow, GridSpacer } from './Layout';
import { TimeInput, RangeInput, Updated } from './Inputs';

const mediaKindOptions = [
  { value: 'music', label: 'Music' },
  { value: 'movie', label: 'Movie' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'tv_show', label: 'TV Show' },
  { value: 'home_video', label: 'Home Video' },
  { value: 'voice_memo', label: 'Voice Memo' },
  { value: 'book', label: 'Book' },
];

export const Options = ({
  track,
  updated,
  onChange,
  onReset,
}) => {
  const myOnChange = useCallback((opt) => onChange({ media_kind: opt.value }), [onChange]);
  return (
    <Grid>
      <GridRow label="media kind">
        <MenuInput value={track.media_kind || ''} options={mediaKindOptions} onChange={myOnChange} />
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

Options.displayName = 'Options';
