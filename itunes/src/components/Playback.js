import React from 'react';

export class Playback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
      duration: 0,
      paused: true,
    };
    this.currentPlayer = React.createRef();
    this.nextPlayer = React.createRef();
    window.currentPlayer = this.currentPlayer;
    this.onTrackEnd = this.onTrackEnd.bind(this);
    //this.timeChange = this.timeChange.bind(this);
  }

  /*
  timeChange(evt) {
    this.setState({
      currentTime: evt.target.currentTime,
      duration: evt.target.duration,
    });
  }
  */

  onTrackEnd() {
    console.debug('track ended, playing next');
    if (this.nextPlayer && this.nextPlayer.current) {
      this.nextPlayer.current.play();
    }
    this.props.onAdvanceQueue();
  }

  componentDidMount() {
    this.currentPlayer.current.play();
    //this.props.onTrackEnd();
  }

  render() {
    if (!this.props.currentTrack) {
      return null;
    }
    return [
      (<audio
        key={this.props.currentTrack.persistent_id}
        ref={this.currentPlayer}
        src={`/api/track/${this.props.currentTrack.persistent_id}`}
        onCanPlay={evt => evt.target.play()}
        onDurationChange={this.props.onDurationChange}
        onEnded={this.onTrackEnd}
        onPlaying={this.props.onPlaying}
        onPause={this.props.onPause}
        onSeeked={this.props.onSeeked}
        onTimeUpdate={this.props.onTimeUpdate}
      />),
      (this.props.nextTrack ? (<audio
        key={this.props.nextTrack.persistent_id}
        ref={this.nextPlayer}
        src={`/api/track/${this.props.nextTrack.persistent_id}`}
        preload="auto"
      />) : null),
    ];
  }
}
