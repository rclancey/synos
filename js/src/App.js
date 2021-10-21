import React, { useEffect, useMemo, useState } from 'react';
import _JSXStyle from 'styled-jsx/style';
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
import Config from './components/Desktop/Admin/Config';
import './styles/theme.css';
import './styles/common.css';
import './styles/login.css';
import './styles/desktop.css';
import './styles/mobile.css';

//const backend = MultiBackend(HTML5toTouch);

export const App = () => {
  const [configStatus, setConfigStatus] = useState(null);
  useEffect(() => {
    fetch('/api/setup/status', { method: 'GET' })
      .then((resp) => resp.json())
      .then(setConfigStatus)
      .catch(() => setConfigStatus([]));
  }, []);
  const backend = useMemo(() => (isMobile(getUserAgent()) ? TouchBackend : HTML5Backend), []);
  if (configStatus === null) {
    return null;
  }
  if (configStatus.length > 0 || (typeof document !== 'undefined' && document.location.pathname === '/admin')) {
    return (
      <div className="page">
        <style jsx>{`
          .page {
            width: 100vw;
            height: 100vh;
            box-sizing: border-box;
            padding: 12px;
            overflow: auto;
          }
        `}</style>
        <Config cause={configStatus} />
      </div>
    );
  }
  return (
    <DndProvider backend={HTML5Backend}>
      <Main />
    </DndProvider>
  );
};

export default App;
