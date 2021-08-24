import React, { useMemo } from 'react';
//import { /*DndProvider,*/ DragDropContextProvider } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
//import MultiBackend from 'react-dnd-multi-backend';
//import HTML5toTouch from 'react-dnd-multi-backend/lib/HTML5toTouch';
import '@fortawesome/fontawesome-free/css/all.css';
import './themes/animations.css';
import { Main } from './components/Main';
import { isMobile, getUserAgent } from './lib/useMedia';
import './styles/theme.css';
import './styles/common.css';
import './styles/login.css';

//const backend = MultiBackend(HTML5toTouch);

export const App = () => {
  const backend = useMemo(() => (isMobile(getUserAgent()) ? TouchBackend : HTML5Backend), []);
  return (
    <DndProvider backend={HTML5Backend}>
      <Main />
    </DndProvider>
  );
};

export default App;
