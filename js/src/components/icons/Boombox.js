import React from 'react';

const baseWidth = 512;
const baseHeight = 512;
const baseRatio = baseWidth / baseHeight;

export const Boombox = ({ color = 'currentColor', aspectRatio = 1 }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 512 512"
      fill={color}
    >
      <g>
        <circle cx="220" cy="336" r="12"/>
      </g>
      <g>
        <path d="M0,244v164c0,15.436,12.572,28,28.008,28h456C499.444,436,512,423.436,512,408V244H0z M98.008,404 c-38.596,0-70-31.404-70-70s31.404-70,70-70s70,31.404,70,70S136.604,404,98.008,404z M320,372c0,2.212-1.788,4-4,4H196 c-2.212,0-4-1.788-4-4v-72c0-2.212,1.788-4,4-4h120c2.212,0,4,1.788,4,4V372z M414.008,404c-38.596,0-70-31.404-70-70 s31.404-70,70-70s70,31.404,70,70S452.604,404,414.008,404z"/>
      </g>
      <g>
        <path d="M98.008,292c-23.16,0-42,18.84-42,42c0,23.16,18.84,42,42,42c23.16,0,42-18.84,42-42 C140.008,310.84,121.168,292,98.008,292z"/>
      </g>
      <g>
        <path d="M484.008,144H420v-24c0-24.26-19.732-44-43.992-44h-240C111.748,76,92,95.74,92,120v24H28.008C12.572,144,0,156.564,0,172 v56h512v-56C512,156.564,499.444,144,484.008,144z M64.008,216c-13.236,0-24-10.764-24-24c0-13.236,10.764-24,24-24 c13.236,0,24,10.764,24,24C88.008,205.236,77.244,216,64.008,216z M116,120c0-11.028,8.98-20,20.008-20h240 c11.028,0,19.992,8.972,19.992,20v24H116V120z M148.008,204h-32c-6.616,0-12-5.384-12-12c0-6.616,5.384-12,12-12h32 c6.616,0,12,5.384,12,12C160.008,198.616,154.624,204,148.008,204z M196.008,204h-12c-6.616,0-12-5.384-12-12 c0-6.616,5.384-12,12-12h12c6.616,0,12,5.384,12,12C208.008,198.616,202.624,204,196.008,204z M464.008,212h-132 c-4.416,0-8-3.584-8-8s3.584-8,8-8h132c4.416,0,8,3.584,8,8S468.424,212,464.008,212z M464.008,184h-132c-4.416,0-8-3.584-8-8 s3.584-8,8-8h132c4.416,0,8,3.584,8,8S468.424,184,464.008,184z"/>
      </g>
      <g>
        <circle cx="292" cy="336" r="12"/>
      </g>
      <g>
        <path d="M414.008,292c-23.16,0-42,18.84-42,42c0,23.16,18.84,42,42,42c23.16,0,42-18.84,42-42 C456.008,310.84,437.168,292,414.008,292z"/>
      </g>
    </svg>
  );
};

export default Boombox;
