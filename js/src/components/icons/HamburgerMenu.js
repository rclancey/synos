import React from 'react';

const baseWidth = 24;
const baseHeight = 24;
const baseRatio = baseWidth / baseHeight;

export const HamburgerMenu = ({ color = 'currentColor', aspectRatio = 1 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M4 7H20M4 12H20M4 17H20" stroke={color} stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  );
};

export default HamburgerMenu;
