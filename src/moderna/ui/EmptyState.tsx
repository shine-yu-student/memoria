import React from 'react';
import s from './Surfaces.module.css';

interface Props {
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ icon = '🗂️', title, description, action }) => (
  <div className={s.empty}>
    <div className={s.emptyIcon}>{icon}</div>
    <h3 className={s.emptyTitle}>{title}</h3>
    {description ? <p className={s.emptyDesc}>{description}</p> : null}
    {action}
  </div>
);
