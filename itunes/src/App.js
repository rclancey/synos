import React, { Component } from 'react';
import { DragDropContextProvider } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import 'react-virtualized/styles.css';
import 'react-sortable-tree/style.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.css';
import { Library } from './components/Library';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
    };
  }

  render() {
    return (
      <div className="App">
        <DragDropContextProvider backend={HTML5Backend}>
          <Library />
        </DragDropContextProvider>
      </div>
    );
  }
}

export default App;
