import React from 'react';

const baseWidth = 512;
const baseHeight = 512;
const baseRatio = baseWidth / baseHeight;

export const DrumKit = ({ color = 'currentColor', aspectRatio = 1 }) => {
  return (
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 512 512"
      fill={color}
    >
      <g>
        <path d="M338.101,441.797l-30.979-22.385c-8.446,4.183-17.47,7.364-26.919,9.393l44.205,31.942 c2.07,1.495,4.464,2.216,6.837,2.216c3.625,0,7.2-1.681,9.485-4.844C344.511,452.885,343.335,445.578,338.101,441.797z"/>
      </g>
      <g>
        <path d="M206.958,420.554l-29.393,21.237c-5.233,3.78-6.411,11.087-2.629,16.321c3.78,5.233,11.086,6.411,16.321,2.629 l43.342-31.316C224.911,427.623,215.644,424.61,206.958,420.554z"/>
      </g>
      <g>
        <path d="M170.667,93.458h-67.799V60.727c0-6.456-5.233-11.689-11.69-11.689s-11.69,5.233-11.69,11.689v32.731H11.69 C5.233,93.458,0,98.691,0,105.147s5.233,11.69,11.69,11.69h158.977c6.456,0,11.69-5.233,11.69-11.69 S177.123,93.458,170.667,93.458z"/>
      </g>
      <g>
        <path d="M170.667,162.426c6.456,0,11.69-5.233,11.69-11.69s-5.233-11.69-11.69-11.69H11.69c-6.456,0-11.69,5.233-11.69,11.69 s5.233,11.69,11.69,11.69h67.799v34.568l-26.181-3.062c-16.219-1.89-30.955,9.756-32.851,25.972l-1.243,10.628 c-0.919,7.857,1.276,15.6,6.183,21.804c4.906,6.205,11.934,10.128,19.79,11.047l34.302,4.012v153.599l-35.038,19.611 c-5.633,3.153-7.644,10.276-4.491,15.909c3.153,5.632,10.274,7.645,15.909,4.491l23.854-13.352 c1.085,5.334,5.8,9.347,11.455,9.347c5.602,0,10.276-3.941,11.417-9.2l23.593,13.208c1.806,1.011,3.766,1.492,5.699,1.492 c4.094,0,8.068-2.156,10.211-5.982c3.154-5.633,1.144-12.757-4.49-15.909l-34.739-19.449V270.128l42.091,4.921 c0.726,0.085,1.45,0.134,2.172,0.166c6.635-17.87,17.559-33.672,31.511-46.154c-2.506-12.17-12.564-21.942-25.563-23.462 l-50.212-5.872v-37.302H170.667z"/>
      </g>
      <g>
        <path d="M500.31,139.047H341.333c-6.456,0-11.689,5.233-11.689,11.69s5.233,11.69,11.689,11.69h67.799v37.267l-50.509,5.906 c-13,1.521-23.058,11.293-25.563,23.462c13.954,12.483,24.876,28.284,31.513,46.155c0.722-0.032,1.446-0.081,2.172-0.166 l42.388-4.956v150.901l-35.038,19.616c-5.633,3.154-7.644,10.277-4.49,15.909c2.143,3.827,6.116,5.982,10.211,5.982 c1.932,0,3.893-0.48,5.699-1.492l23.854-13.354c1.085,5.333,5.8,9.346,11.453,9.346c5.602,0,10.277-3.942,11.418-9.202 l23.593,13.206c5.636,3.154,12.757,1.143,15.909-4.491c3.153-5.633,1.143-12.757-4.491-15.909l-34.74-19.444v-153.8l34.006-3.976 c7.857-0.919,14.884-4.842,19.79-11.047c4.905-6.205,7.101-13.948,6.183-21.804l-1.243-10.628 c-1.896-16.217-16.632-27.864-32.851-25.972l-25.885,3.025v-34.533h67.799c6.456,0,11.69-5.233,11.69-11.69 S506.767,139.047,500.31,139.047z"/>
      </g>
      <g>
        <path d="M500.31,93.458h-67.799V60.727c0-6.456-5.233-11.689-11.69-11.689s-11.689,5.233-11.689,11.689v32.731h-67.799 c-6.456,0-11.689,5.233-11.689,11.69s5.233,11.69,11.689,11.69H500.31c6.456,0,11.69-5.233,11.69-11.69 S506.767,93.458,500.31,93.458z"/>
      </g>
      <g>
        <path d="M255.852,217.063c-54.254,0-98.394,44.14-98.394,98.394s44.14,98.394,98.394,98.394s98.394-44.14,98.394-98.394 S310.106,217.063,255.852,217.063z"/>
      </g>
    </svg>
  );
};

export default DrumKit;
