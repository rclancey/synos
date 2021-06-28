import React from 'react';
import { Icon } from '../Icon';

export const HomeItem = ({
  name,
  icon,
  iconSrc,
  onOpen,
  children,
}) => (
  <div className="item" onClick={() => onOpen(name, children)}>
    <Icon name={icon} src={iconSrc} size={36} />
    <div className="title">{name}</div>
    <style jsx>{`
      .item {
        display: flex;
        flex-direction: row;
        margin: 9px 0.5em;
      }
      .item .title {
        flex: 10;
        font-size: 18px;
        line-height: 36px;
        padding: 0 9px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: hidden;
      }
    `}</style>
  </div>
);
