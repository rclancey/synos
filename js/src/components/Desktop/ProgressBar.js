import React from 'react';
import logo from '../../logo.svg';

export const ProgressBar = ({ total, complete }) => {
  if (total <= 0) {
    return null;
  }
  return (
    <div id="loading">
      <img src={logo} alt="loading..." className="App-logo" />
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
        } 
        #loading .progress {
          position: absolute;
          top: 70vh; 
          left: 25vw;
          width: 50vw;
          border: solid black 1px;
          height: 1vh;
          border-radius: 1vh;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.5);
        } 
        #loading .progress .complete {
          height: 100%;
          background: url(/progress-alpha.png);
          background-color: #6cf;
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
        }
      `}</style>
    </div>
  );
}

