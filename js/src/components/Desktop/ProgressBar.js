import React from 'react';
import _JSXStyle from "styled-jsx/style";
import ReactLogo from '../icons/ReactLogo';

export const ProgressBar = React.memo(({ total, complete }) => {
  if (total <= 0) {
    return null;
  }
  return (
    <div id="loading">
      <div className="App-logo">
        <ReactLogo />
      </div>
      <div className="progress">
        <div className="complete" style={{ width: (100 * complete / total)+'%' }} />
      </div>
      <style jsx>{`
        @keyframes App-logo-spin {
          from {
          transform: rotate(0deg);
          }
          to {
          transform: rotate(360deg);
          }
        }

        @keyframes Prog-Scroll {
          from {
          background-position: 0 0;
          }
          to {
          background-position: 45px 0px;
          }
        }

        #loading {
          position: fixed;
          top: 0; 
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 10000;
          background-color: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(1px);
        } 
        #loading .progress {
          position: absolute;
          top: 70vh; 
          left: 25vw;
          width: 50vw;
          border: solid black 1px;
          height: 6px;
          border-radius: 10px;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.5);
        } 
        #loading .progress .complete {
          height: 100%;
          background: url(/assets/progress-alpha.png);
          background-color: var(--highlight);
          animation: Prog-Scroll infinite 1s linear;
        }
        .App-logo {
          animation: App-logo-spin infinite 5s linear;
          height: 40vmin;
          pointer-events: none;
          position: absolute;
          top: 50vh;
          left: 50vw;
          margin-top: -20vmin;
          margin-left: -28.25vmin;
          color: var(--highlight);
        }
        .App-logo :global(svg) {
          height: 40vmin;
        }
      `}</style>
    </div>
  );
});
