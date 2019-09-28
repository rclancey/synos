import React, { useState, useEffect } from 'react';
import { useTheme } from '../../lib/theme';
import { HomeItem } from './HomeItem';
import { PlaylistList } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList } from './AlbumList';
import { GenreList } from './GenreList';
//import { PodcastList } from './PodcastList';
//import { AudiobookList } from './AudiobookList';
import { Purchases } from './Purchases';
import { RecentAdditions } from './RecentAdditions';
import { ScreenHeader } from './ScreenHeader';

export const Sources = React.memo(({ prev, children, onOpen, onFinish, ...props }) => {
  const colors = useTheme();
  if (children) {
    return children;
  }
  return (
    <div className="home">
      <ScreenHeader
        name="Lubrary"
        prev={prev}
        onClose={onFinish}
      />
      <div className="items">
        <HomeItem name="Playlists" icon="playlists" onOpen={onOpen}>
          <PlaylistList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Artists" icon="artists" onOpen={onOpen}>
          <ArtistList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Albums" icon="albums" onOpen={onOpen}>
          <AlbumList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Genres" icon="genres" onOpen={onOpen}>
          <GenreList prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Recently Added" icon="recent" onOpen={onOpen}>
          <RecentAdditions prev="Library" {...props} />
        </HomeItem>
        <HomeItem name="Purchases" icon="purchased" onOpen={onOpen}>
          <Purchases prev="Library" {...props} />
        </HomeItem>
      </div>
      <style jsx>{`
        .header {
          padding: 0.5em;
          padding-top: 54px;
          background-color: ${colors.sectionBackground};
        }
        .header .title {
          font-size: 24pt;
          font-weight: bold;
          margin-top: 0.5em;
          padding-left: 0.5em;
          color: ${colors.highlightText};
        }
        .items {
          width: 100vw;
          height: calc(100vh - 185px);
          overflow: auto;
          padding: 0 0.5em;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
});
