import React from 'react';

import Seeker from './Seeker';

export const RewindButton = ({ size = 15, onSkipBy, onSeekBy }) => (
  <Seeker size={size} fwd={false} onSkip={onSkipBy} onSeek={onSeekBy} />
);

export default RewindButton;
