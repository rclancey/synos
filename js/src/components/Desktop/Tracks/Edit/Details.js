import React from 'react';
import { Grid, GridRow, GridSpacer } from './Layout';
import { TextInput, GenreInput, IntegerInput, StarInput, DateInput, BooleanInput, Updated } from './Inputs';
import { formatRelDate } from './util.js';

export const Details = ({
  track,
  updated,
  genres,
  onChange,
  onReset,
}) => {
  return (
    <Grid>
      {updated ? null : (
        <GridRow label="song">
          <TextInput track={track} field="name" onChange={onChange} />
          <Updated updated={updated} field="name" onReset={onReset} />
        </GridRow>
      )}
      <GridRow label="artist">
        <TextInput track={track} field="artist" onChange={onChange} />
        <Updated updated={updated} field="artist" onReset={onReset} />
      </GridRow>
      <GridRow label="album">
        <TextInput track={track} field="album" onChange={onChange} />
        <Updated updated={updated} field="album" onReset={onReset} />
      </GridRow>
      <GridRow label="album artist">
        <TextInput track={track} field="album_artist" onChange={onChange} />
        <Updated updated={updated} field="album_artist" onReset={onReset} />
      </GridRow>
      <GridRow label="composer">
        <TextInput track={track} field="composer" onChange={onChange} />
        <Updated updated={updated} field="composer" onReset={onReset} />
      </GridRow>
      <GridRow label="grouping">
        <TextInput track={track} field="grouping" onChange={onChange} />
        <Updated updated={updated} field="grouping" onReset={onReset} />
      </GridRow>
      <GridRow label="genre">
        <GenreInput track={track} genres={genres}  onChange={onChange} />
        <Updated updated={updated} field="genre" onReset={onReset} />
      </GridRow>

      <GridSpacer />
      <GridRow label="release date">
        <DateInput track={track} field="release_date" onChange={onChange} />
        <Updated updated={updated} field="release_date" onReset={onReset} />
      </GridRow>
      <GridRow label="track">
        <IntegerInput
          track={track}
          field="track_number"
          min={1}
          max={999}
          onChange={onChange}
        />
        {' of '}
        <IntegerInput
          track={track}
          field="track_count"
          min={1}
          max={999}
          onChange={onChange}
        />
        <Updated updated={updated} fields={["track_number", "track_count"]} onReset={onReset} />
      </GridRow>
      <GridRow label="disc number">
        <IntegerInput
          track={track}
          field="disc_number"
          min={1}
          max={999}
          onChange={onChange}
        />
        {' of '}
        <IntegerInput
          track={track}
          field="disc_count"
          min={1}
          max={999}
          onChange={onChange}
        />
        <Updated updated={updated} fields={["disc_number", "disc_count"]} onReset={onReset} />
      </GridRow>
      <GridRow label="compilation">
        <BooleanInput track={track} field="compilation" onChange={onChange}>
          Album is a compilation of songs by various artists
        </BooleanInput>
        <Updated updated={updated} field="compilation" onReset={onReset} />
      </GridRow>

      <GridSpacer />
      <GridRow label="rating">
        <StarInput track={track} field="rating" onChange={onChange} onReset={onReset} />
        <Updated updated={updated} field="rating" />
      </GridRow>
      <GridRow label="bpm">
        <IntegerInput
          track={track}
          field="bpm"
          min={1}
          max={1000}
          onChange={onChange}
        />
        <Updated updated={updated} field="bpm" onReset={onReset} />
      </GridRow>
      {updated ? null : (
        <GridRow label="play count">
          {track.play_count}
          {track.play_date ? ` (Last played ${formatRelDate(track.play_date)})` : null}
        </GridRow>
      )}
      <GridRow label="comments">
        <TextInput track={track} field="comments" onChange={onChange} />
        <Updated updated={updated} field="comments" onReset={onReset} />
      </GridRow>
    </Grid>
  );
};

Details.displayName = 'Details';
