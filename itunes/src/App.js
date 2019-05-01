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

class App extends Component {
  constructor(props) {
    super(props);
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
    };
  }

  render() {
    return (
      <div className="App">
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
