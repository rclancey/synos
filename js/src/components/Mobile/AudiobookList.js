import React from 'react';
import _JSXStyle from 'styled-jsx/style';
import { ScreenHeader } from './ScreenHeader';

export const AudiobookList = ({
  prev,
  adding,
  controlAPI,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
}) => (
  <div className="audiobookList">
    <ScreenHeader
      name="Audiobooks"
      prev={prev}
      onClose={onClose}
    />
    <div className="items">
      Sorry, this screen is not yet available
    </div>
    <style jsx>{`
      .audiobookList {
        width: 100vw;
        height: 100vh;
        box-sizing: border-box;
        overflow: hidden;
      }
      .audiobookList .items {
        height: calc(100vh - 185px);
      }
    `}</style>
  </div>
);
