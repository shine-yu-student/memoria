import React from 'react';
import s from './Surfaces.module.css';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string;
}

export const SearchInput: React.FC<Props> = ({ className, ...rest }) => (
  <div className={`${s.searchWrap} ${className ?? ''}`}>
    <span className={s.searchIcon}>🔍</span>
    <input type="search" className={s.searchField} {...rest} />
  </div>
);
