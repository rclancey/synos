import React, { useMemo, useState, useRef, useEffect } from 'react';
import _JSXStyle from "styled-jsx/style";
import { NavLink } from 'react-router-dom';

import { SVGIcon } from '../../SVGIcon';
import { Icon } from '../../Icon';
//import Link from '../../Mobile/Link';

import CassetteIcon from '../../icons/Cassette';
import BrainIcon from '../../icons/Brain';
import AtomIcon from '../../icons/Atom';
import PlaylistFolderIcon from '../../icons/PlaylistFolder';
import BroadcastMicrophoneIcon from '../../icons/BroadcastMicrophone';
import BoomboxIcon from '../../icons/Boombox';
import EighthNoteIcon from '../../icons/EighthNote';
import GuitarPlayerIcon from '../../icons/GuitarPlayer';
import RecordIcon from '../../icons/Record';
import TimerIcon from '../../icons/Timer';
import ShoppingCartIcon from '../../icons/ShoppingCart';

const Link = ({ to, children, ...props }) => {
  if (!to) {
    return children;
  }
  return (
    <NavLink to={to} {...props}>
      {children}
    </NavLink>
  );
};

const XIcon = ({ name, size, ...props }) => {
  switch (name) {
    case 'folder':
      return <SVGIcon icn={PlaylistFolderIcon} size={size} />;
    case 'genius':
      return <SVGIcon icn={AtomIcon} size={size} />;
    case 'smart':
      return <SVGIcon icn={BrainIcon} size={size} />;
    case 'standard':
      return <SVGIcon icn={CassetteIcon} size={size} />;
    case 'podcasts':
      return <SVGIcon icn={BroadcastMicrophoneIcon} size={size} />;
    case 'music':
      return <SVGIcon icn={EighthNoteIcon} size={size} />;
    case 'songs':
      return <SVGIcon icn={BoomboxIcon} size={size} />;
    case 'artists':
      return <SVGIcon icn={GuitarPlayerIcon} size={size} />;
    case 'albums':
      return <SVGIcon icn={RecordIcon} size={size} />;
    case 'recent':
      return <SVGIcon icn={TimerIcon} size={size} />;
    case 'purchased':
      return <SVGIcon icn={ShoppingCartIcon} size={size} />;
    default:
      return <Icon name={name} size={size} {...props} />;
  }
};

const FolderToggle = ({
  folder,
  open,
  onToggle,
}) => {
  if (!folder) {
    return null;
  }
  return (
    <div
      className={`folderToggle ${open ? 'open' : ''}`}
      onClick={onToggle}
    >
      <style jsx>{`
        .folderToggle {
          width: 0;
          height: 0;
          border: solid transparent 6px;
          margin-left: 10px;
          margin-right: -23px;
          border-bottom-width: 5px;
          border-top-width: 5px;
          border-left-width: 6px;
          position: relative;
          top: 4px;
          left: 1px;
          border-left-color: var(--text);
        }
        .folderToggle.open {
          border-left-color: transparent !important;
          border-right-width: 5px;
          border-left-width: 5px;
          border-top-width: 6px;
          left: -2px;
          top: 6px;
          margin-right: -21px;
          border-top-color: var(--text);
        }
      `}</style>
    </div>
  );
};

export const Label = ({
  depth = 0,
  indentPixels = 1,
  icon,
  name,
  to,
  exact,
  folder,
  open,
  highlight,
  selected,
  onToggle,
  onRename,
  onSelect,
}) => {
  const input = useRef(null);
  const [editing, setEditing] = useState(false);
  const [nameUpdate, setNameUpdate] = useState(name);
  useEffect(() => {
    if (editing && !selected) {
      setEditing(false);
    }
    if (!editing) {
      input.current = null;
    }
  }, [editing, selected]);
  const indent = {
    paddingLeft: `${indentPixels * depth}px`,
  };
  const cls = ['label'];
  if (selected) {
    cls.push('selected');
  }
  if (highlight) {
    cls.push('dropTarget');
  }
  if (editing) {
    cls.push('editing');
  }
  return (
    <Link to={to} exact={exact}>
    <div className={cls.join(' ')} style={indent}>
      <FolderToggle folder={folder} open={open} onToggle={onToggle} />
      <XIcon
        name={icon && !icon.includes(".") ? icon : ''}
        src={icon && icon.includes(".") ? icon : null}
        size={16}
      />
      <div className="title" onClick={(selected && !editing && onRename) ? () => { setNameUpdate(name); setEditing(true); } : onSelect}>
        { (selected && editing) ? (
          <input
            ref={node => {
              if (node && !input.current) {
                input.current = node;
                node.focus();
                node.select();
              }
            }}
            onKeyDown={evt => {
              if (evt.key === 'Enter') {
                evt.stopPropagation();
                evt.preventDefault();
                if (onRename) {
                  onRename(evt.target.value);
                }
                setEditing(false);
                return false;
              }
            }}
            type="text"
            tabIndex={30}
            value={nameUpdate}
            onChange={evt => setNameUpdate(evt.target.value)}
          />
        ) : name }
      </div>
      <style jsx>{`
        .label {
          display: flex;
          padding-top: 3px;
          padding-bottom: 3px;
          cursor: default;
        }
        .label.editing {
          padding-top: 2px;
          padding-bottom: 2px;
        }
        .title {
          font-weight: normal;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .title input {
          outline: none;
          border: solid Highlight 1px;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          font-family: Tahoma;
          font-size: 13px;
          padding: 0px;
        }
      `}</style>
    </div>
    </Link>
  );
};
