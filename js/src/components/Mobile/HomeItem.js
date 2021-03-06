import React from 'react';
import _JSXStyle from 'styled-jsx/style';
import SVGIcon from '../SVGIcon';

export const HomeItem = ({
  name,
  icon,
  iconSrc,
  onOpen,
  children,
}) => (
  <div className="item" onClick={() => onOpen(name, children)}>
    <SVGIcon icn={icon} size={36} />
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
