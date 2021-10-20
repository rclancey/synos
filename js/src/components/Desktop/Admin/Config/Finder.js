import React, { useCallback } from 'react';

import { MultiStringInput } from './Input';
/*
    MediaPath   []string `json:"media_path"`//   arg:"--media-path"`
    MediaFolder []string `json:"media_folder"`// arg:"--media-folder"`
    CoverArt    []string `json:"cover_art"`//    arg:"--cover-art"`
*/

export const Finder = ({ cfg, onChange }) => (
  <>
    <div className="header">Media Finder</div>
    <div className="key">Media Paths:</div>
    <div className="value">
      <MultiStringInput name="media_path" cfg={cfg} onChange={onChange} cols={60} rows={4} />
    </div>
    <div className="key">Media Folder:</div>
    <div className="value">
      <MultiStringInput name="media_folder" cfg={cfg} onChange={onChange} cols={60} rows={4} />
    </div>
    <div className="key">Cover Art:</div>
    <div className="value">
      <MultiStringInput name="cover_art" cfg={cfg} onChange={onChange} cols={60} rows={4} />
    </div>
  </>
);

export default Finder;
