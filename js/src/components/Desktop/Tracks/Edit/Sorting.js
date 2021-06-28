import React from 'react';
import { Grid, GridRow, GridSpacer } from './Layout';
import { TextInput, Updated } from './Inputs';

export const Sorting = ({
  track,
  updated,
  onChange,
  onReset,
}) => {
  return (
    <Grid>
      {updated ? null : (<>
        <GridRow label="name">
          <TextInput track={track} field="name" onChange={onChange} />
          <Updated updated={updated} field="name" onReset={onReset} />
        </GridRow>
        <GridRow label="sort as">
          <TextInput
            track={track}
            field="sort_name"
            placeholder={track.name}
            onChange={onChange}
          />
          <Updated updated={updated} field="sort_name" onReset={onReset} />
        </GridRow>
        <GridSpacer />
      </>)}

      <GridRow label="album">
        <TextInput track={track} field="album" onChange={onChange} />
        <Updated updated={updated} field="album" onReset={onReset} />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_album"
          placeholder={track.album}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_album" onReset={onReset} />
      </GridRow>

      <GridSpacer />
      <GridRow label="album artist">
        <TextInput track={track} field="album_artist" onChange={onChange} />
        <Updated updated={updated} field="album_artist" onReset={onReset} />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_album_artist"
          placeholder={track.album_artist}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_album_artist" onReset={onReset} />
      </GridRow>

      <GridSpacer />
      <GridRow label="artist">
        <TextInput track={track} field="artist" onChange={onChange} />
        <Updated updated={updated} field="artist" onReset={onReset} />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_artist"
          placeholder={track.artist}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_artist" onReset={onReset} />
      </GridRow>

      <GridSpacer />
      <GridRow label="composer">
        <TextInput track={track} field="composer" onChange={onChange} />
        <Updated updated={updated} field="composer" onReset={onReset} />
      </GridRow>
      <GridRow label="sort as">
        <TextInput
          track={track}
          field="sort_composer"
          placeholder={track.composer}
          onChange={onChange}
        />
        <Updated updated={updated} field="sort_composer" onReset={onReset} />
      </GridRow>
    </Grid>
  );
};
