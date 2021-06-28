import React from 'react';
import { ScreenHeader } from './ScreenHeader';

export const PodcastList = ({
  prev,
  adding,
  controlAPI,
  onClose,
  onTrackMenu,
  onPlaylistMenu,
}) => (
  <div className="podcastList">
    <ScreenHeader
      name="Podcasts"
      prev={prev}
      onClose={onClose}
    />
    <div className="items">
      Sorry, this screen is not yet available
    </div>
    <style jsx>{`
      .podcastList {
        width: 100vw;
        height: 100vh;
        box-sizing: border-box;
        overflow: hidden;
      }
      .podcastList .items {
        height: calc(100vh - 185px);
      }
    `}</style>
  </div>
);
