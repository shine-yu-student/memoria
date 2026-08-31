import React from 'react';
import s from './Surfaces.module.css';

interface Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  padded?: boolean;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<Props> = ({ padded, hoverable, className, children, ...rest }) => (
  <div
    className={[s.card, padded ? s.cardPad : '', hoverable ? s.cardHover : '', className ?? '']
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </div>
);
