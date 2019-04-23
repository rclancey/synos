import React from 'react';
import { PlaylistList } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList } from './AlbumList';
import { GenreList } from './GenreList';
import { PodcastList } from './PodcastList';
import { AudiobookList } from './AudiobookList';
import { TrackMenu } from './TrackMenu';

export class HomeList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: null,
      trackMenuTrack: null,
      playlistMenuTracks: null,
      queue: [],
      queueIndex: null,
    };
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onTrackMenu = this.onTrackMenu.bind(this);
    this.onPlaylistMenu = this.onPlaylistMenu.bind(this);
    this.onPlay = this.onPlay.bind(this);
    this.onQueueNext = this.onQueueNext.bind(this);
    this.onQueue = this.onQueue.bind(this);
    this.onReplaceQueue = this.onReplaceQueue.bind(this);
    this.onSkip = this.onSkip.bind(this);
  }

  onOpen(screen) {
    this.setState({ screen });
  }

  onClose() {
    this.setState({ screen: null });
  }

  onTrackMenu(track) {
    this.setState({ trackMenuTrack: track });
  }

  onPlaylistMenu(tracks) {
    this.setState({ playlistMenuTracks: tracks });
  }

  onPlay(tracks) {
  }

  onQueueNext(tracks) {
  }

  onQueue(tracks) {
  }

  onReplaceQueue(tracks) {
  }

  onSkip() {
  }

  renderScreen() {
    if (this.state.screen == 'playlists') {
      return (
        <PlaylistList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'artists') {
      return (
        <ArtistList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'albums') {
      return (
        <AlbumList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'genres') {
      return (
        <GenreList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'podcasts') {
      return (
        <PodcastList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    if (this.state.screen == 'audiobooks') {
      return (
        <AudiobookList
          prev="Library"
          onClose={this.onClose}
          onTrackMenu={this.onTrackMenu}
        />
      );
    }
    return (
      <div className="home">
        <div className="header">
          <div className="title">Library</div>
        </div>
        <div className="items">
          <div className="item" onClick={() => this.onOpen('playlists')}>
            <div className="icon playlists" />
            <div className="title">Playlists</div>
          </div>
          <div className="item" onClick={() => this.onOpen('artists')}>
            <div className="icon artists" />
            <div className="title">Artists</div>
          </div>
          <div className="item" onClick={() => this.onOpen('albums')}>
            <div className="icon albums" />
            <div className="title">Albums</div>
          </div>
          <div className="item" onClick={() => this.onOpen('genres')}>
            <div className="icon genres" />
            <div className="title">Genres</div>
          </div>
          <div className="item" onClick={() => this.onOpen('podcasts')}>
            <div className="icon podcasts" />
            <div className="title">Podcasts</div>
          </div>
          <div className="item" onClick={() => this.onOpen('audiobooks')}>
            <div className="icon audiobooks" />
            <div className="title">Audiobooks</div>
          </div>
          <div className="item" onClick={() => this.onOpen('recent')}>
            <div className="icon recent" />
            <div className="title">Recently Added</div>
          </div>
          <div className="item" onClick={() => this.onOpen('purchased')}>
            <div className="icon purchased" />
            <div className="title">Purchases</div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderScreen()}
        {this.state.trackMenuTrack ? (
          <TrackMenu
            track={this.state.trackMenuTrack}
            onClose={() => this.setState({ trackMenuTrack: null })}
            onPlay={this.onPlay}
            onQueueNext={this.onQueueNext}
            onQueue={this.onQueue}
            onReplaceQueue={this.onReplaceQueue}
          />
        ) : null}
      </div>
    );
  }
}

