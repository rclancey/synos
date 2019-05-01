import React, { Component } from 'react';
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import 'react-virtualized/styles.css';
import 'react-sortable-tree/style.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.css';
//import { Library } from './components/Library';
//import { HomeList } from './components/HomeList';
import { Player } from './components/Player';

const InstallAppButton = ({ onInstall }) => (
  <div className="installApp" onClick={onInstall}>
    install me
  </div>
);

class App extends Component {
  constructor(props) {
    super(props);
    let standalone = false;
    if (typeof window !== 'undefined') {
      if (window.navigator && window.navigator.standalone) {
        standalone = true;
      } else if (window.matchMedia('(display-mode: standalone)').matches) {
        standalone = true;
      }
      window.beforeInstallPrompt.then(evt => {
        this.setState({ installPrompt: evt });
      });
      window.addEventListener('appinstalled', evt => {
        console.debug('app installed: %o', evt);
      });
    }
    const query = {}
    document.location.search.substr(1).split('&').map(param => {
      const pair = param.split(/=/);
      const key = unescape(pair.shift());
      const val = unescape(pair.join('='));
      query[key] = val;
    });
    const mobile = navigator.userAgent.match(/iPhone/) || query.mobile;
    this.state = {
      loading: true,
      mobile: mobile,
      loading: true,
      installPrompt: null,
      standalone,
    };
    this.onInstall = this.onInstall.bind(this);
  }

  onInstall() {
    const evt = this.state.installPrompt;
    if (!evt) {
      return;
    }
    evt.prompt();
    evt.userChoice.then(res => {
      if (res.outcome === 'accepted') {
        console.debug('install accepted');
      } else {
        console.debug('install declined');
      }
      this.setState({ installPrompt: null });
    });
  }

  render() {
    return (
      <div className="App">
        { this.state.installPrompt ? (
          <InstallAppButton onInstall={this.onInstall} />
        ) : null }
        <Player mobile={this.state.mobile} />
        {/*
        <HomeList />
        */}
        {/*
        <DragDropContextProvider backend={HTML5Backend}>
          <Library />
        </DragDropContextProvider>
        */}
      </div>
    );
  }
}

export default App;
