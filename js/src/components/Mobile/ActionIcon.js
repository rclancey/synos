import React, { useState } from 'react';
import _JSXStyle from 'styled-jsx/style';
import { Icon } from '../Icon';
import { useTheme } from '../../lib/theme';

export const AddIcon = ({ size, onAdd }) => {
  const [added, setAdded] = useState(false);
  if (added) {
    return (
      <div className="icon fas fa-check-circle">
        <style jsx>{`
          .icon {
            color: #00cc00;
            width: ${size}px;
            height: ${size}px;
            font-size: ${size * 2 / 3}px;
            line-height: ${size}px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }
  return (
    <Icon name="add" size={size} onClick={() => { onAdd(); setAdded(true); }} />
  );
};

export const DeleteIcon = ({ size, onDelete }) => {
  const colors = useTheme();
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <div className="icon confirm">
        <div className="delete" onClick={onDelete}>Delete</div>
        <div className="cancel" onClick={() => setConfirming(false)}>Cancel</div>
        <style jsx>{`
          .confirm {
            display: flex;
          }
          .delete, .cancel {
            height: ${size}px;
            line-height: ${size}px;
            border: solid 0px transparent;
            border-radius: 5px;
            margin-right: 3px;
            color: white;
            box-sizing: border-box;
            padding: 0px 0.5em;
            font-weight: bold;
          }
          .delete {
            background-color: #cc0000;
          }
          .cancel {
            background-color: var(--highlight);
            color: var(--highlight-inverse);
          }
        `}</style>
      </div>
    );
  }
  return (
    <Icon name="delete" size={size} onClick={() => setConfirming(true)} />
  );
};
