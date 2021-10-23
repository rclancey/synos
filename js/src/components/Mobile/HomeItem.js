import React from 'react';
import _JSXStyle from 'styled-jsx/style';

import Link from './Link';
import SVGIcon from '../SVGIcon';

export const HomeItem = ({
  path,
  name,
  icon,
  iconSrc,
  onOpen,
  children,
}) => (
  <div className="item">
    <Link title={name} to={path} className="item">
      <SVGIcon icn={icon} size={36} />
      <div className="title">{name}</div>
    </Link>
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
