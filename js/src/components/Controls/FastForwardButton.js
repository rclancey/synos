import React from 'react';

import Seeker from './Seeker';

export const FastForwardButton = ({ size = 15, onSkipBy, onSeekBy }) => (
  <Seeker size={size} fwd={true} onSkip={onSkipBy} onSeek={onSeekBy} />
);

export default FastForwardButton;
