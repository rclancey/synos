import React, { Component } from 'react';
import '@fortawesome/fontawesome-free/css/all.css';
import './themes/animations.css';
//import './themes/common/light.css';
//import './themes/common/dark.css';
//import './App.css';
//import { Library } from './components/Library';
//import { HomeList } from './components/HomeList';
import { CheckLogin } from './components/Login';
import { API } from './lib/api';
import { Player } from './components/Player';

const importedThemes = {};

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
    document.location.search.substr(1).split('&').forEach(param => {
      const pair = param.split(/=/);
      const key = unescape(pair.shift());
      const val = unescape(pair.join('='));
      query[key] = val;
    });
    const mobile = navigator.userAgent.match(/iPhone/) || query.mobile;
    this.state = {
      loading: true,
      mobile: mobile,
      theme: 'dark',
      installPrompt: null,
      loggedIn: false,
      standalone,
    };
    this.onLoginRequired = this.onLoginRequired.bind(this);
    this.onInstall = this.onInstall.bind(this);

    this.api = new API(this.onLoginRequired);
  }

  onLoginRequired() {
    console.debug('loginRequired');
    this.setState({ loggedIn: false });
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
    if (importedThemes[this.state.theme] === undefined || importedThemes[this.state.theme] === null) {
      importedThemes[this.state.theme] = true;
      import(`./themes/common/${this.state.theme}.css`).then(css => importedThemes[this.state.theme] = css);
    }
    return (
      <div className="App">
        { this.state.installPrompt ? (
          <InstallAppButton onInstall={this.onInstall} />
        ) : null }
        <CheckLogin
          mobile={this.state.mobile}
          theme={this.state.theme}
          loggedIn={this.state.loggedIn}
          onLogin={x => this.setState({ loggedIn: x })}
        >
          <Player mobile={this.state.mobile} theme={this.state.theme} api={this.api} />
        </CheckLogin>
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
