import React from 'react';
import { PlaylistList } from './PlaylistList';
import { ArtistList } from './ArtistList';
import { AlbumList } from './AlbumList';
import { GenreList } from './GenreList';
import { PodcastList } from './PodcastList';
import { AudiobookList } from './AudiobookList';
import { TrackMenu, PlaylistMenu } from './TrackMenu';
import { NowPlaying } from './NowPlaying';

export class MobileSkin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: null,
      trackMenuTrack: null,
      playlistMenuTracks: null,
      playlistMenuTitle: null,
    };
    this.onOpen = this.onOpen.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onTrackMenu = this.onTrackMenu.bind(this);
    this.onPlaylistMenu = this.onPlaylistMenu.bind(this);
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

  onPlaylistMenu(title, tracks) {
    this.setState({ playlistMenuTitle: title, playlistMenuTracks: tracks });
  }

  renderScreen() {
    const props = {
      onPlay: this.props.onPlay,
      onSkipBy: this.props.onSkipBy,
      onReplaceQueue: this.props.onReplaceQueue,
      onAppendToQueue: this.props.onAppendToQueue,
      onInsertIntoQueue: this.props.onInsertIntoQueue,
      onClose: this.onClose,
      onTrackMenu: this.onTrackMenu,
      onPlaylistMenu: this.onPlaylistMenu,
    };
    if (this.state.screen === 'playlists') {
      return (
        <PlaylistList prev="Library" {...props} />
      );
    }
    if (this.state.screen === 'artists') {
      return (
        <ArtistList prev="Library" {...props} />
      );
    }
    if (this.state.screen === 'albums') {
      return (
        <AlbumList prev="Library" {...props} />
      );
    }
    if (this.state.screen === 'genres') {
      return (
        <GenreList prev="Library" {...props} />
      );
    }
    if (this.state.screen === 'podcasts') {
      return (
        <PodcastList prev="Library" {...props} />
      );
    }
    if (this.state.screen === 'audiobooks') {
      return (
        <AudiobookList prev="Library" {...props} />
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
      <div id="app" className={`mobile ${this.props.theme}`}>
        {this.renderScreen()}
        <NowPlaying
          status={this.props.status}
          queue={this.props.queue}
          queueIndex={this.props.queueIndex}
          currentTime={this.props.currentTime}
          duration={this.props.duration}
          volume={this.props.volume}
          sonos={this.props.sonos}
          onPlay={this.props.onPlay}
          onPause={this.props.onPause}
          onSkipTo={this.props.onSkipTo}
          onSkipBy={this.props.onSkipBy}
          onSeekTo={this.props.onSeekTo}
          onSeekBy={this.props.onSeekBy}
          onSetVolumeTo={this.props.onSetVolumeTo}
          onEnableSonos={this.props.onEnableSonos}
          onDisableSonos={this.props.onDisableSonos}
        />
        {this.state.trackMenuTrack ? (
          <TrackMenu
            track={this.state.trackMenuTrack}
            onClose={() => this.setState({ trackMenuTrack: null })}
            onPlay={this.props.onPlay}
            onSkipTo={this.props.onSkipTo}
            onSkipBy={this.props.onSkipBy}
            onInsertIntoQueue={this.props.onInsertIntoQueue}
            onAppendToQueue={this.props.onAppendToQueue}
            onReplaceQueue={this.props.onReplaceQueue}
          />
        ) : null}
        {this.state.playlistMenuTracks ? (
          <PlaylistMenu
            name={this.state.playlistMenuTitle}
            tracks={this.state.playlistMenuTracks}
            onClose={() => this.setState({ playlistMenuTracks: null })}
            onPlay={this.props.onPlay}
            onSkipTo={this.props.onSkipTo}
            onSkipBy={this.props.onSkipBy}
            onInsertIntoQueue={this.props.onInsertIntoQueue}
            onAppendToQueue={this.props.onAppendToQueue}
            onReplaceQueue={this.props.onReplaceQueue}
          />
        ) : null}
      </div>
    );
  }
}

