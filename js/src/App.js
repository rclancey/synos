import React, { Component } from 'react';
import { /*DndProvider,*/ DragDropContextProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import TouchBackend from 'react-dnd-touch-backend';
//import MultiBackend from 'react-dnd-multi-backend';
//import HTML5toTouch from 'react-dnd-multi-backend/lib/HTML5toTouch';
import '@fortawesome/fontawesome-free/css/all.css';
import './themes/animations.css';
import { Main } from './components/Main';
import { isMobile, getUserAgent } from './lib/useMedia';

//const backend = MultiBackend(HTML5toTouch);

class App extends Component {
  /*
  constructor(props) {
    super(props);
  }
  */

  render() {
    const backend = isMobile(getUserAgent()) ? TouchBackend : HTML5Backend;
    return (
      <DragDropContextProvider backend={backend}>
        <Main />
      </DragDropContextProvider>
    );
  }
}

export default App;
