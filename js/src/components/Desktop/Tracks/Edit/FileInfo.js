import React from 'react';
import { Grid, GridRow, GridSpacer } from './Layout';
import { formatDuration, formatSize, formatDate } from './util';

export const FileInfo = ({
  track,
}) => {
  return (
    <Grid>
      <GridRow label="id">{track.persistent_id}</GridRow>
      <GridRow label="owner">{track.owner_id}</GridRow>
      <GridRow label="kind">{track.kind}</GridRow>
      <GridRow label="duration">{formatDuration(track.total_time)}</GridRow>
      <GridRow label="size">{formatSize(track.size)}</GridRow>
      <GridRow label="bit rate">{track.bitrate} kbps</GridRow>
      <GridRow label="sample rate">{(track.sample_rate / 1000).toFixed(3)} kHz</GridRow>

      <GridSpacer />
      { track.purchased ? (
        <GridRow label="purchase date">{formatDate(track.purchase_date)}</GridRow>
      ) : null }
      <GridRow label="date modified">{formatDate(track.date_modified)}</GridRow>
      <GridRow label="date added">{formatDate(track.date_added)}</GridRow>

      <GridSpacer />
      <GridRow label="location">
        <span style={{lineHeight: '16px', display: 'inline-block', marginTop: '4px'}}>{track.location}</span>
      </GridRow>
    </Grid>
  );
};
