import React from 'react';
import s from './PageShell.module.css';

interface Props {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** 省略头部时使用整页滚动（记忆类页面） */
  bare?: boolean;
  children: React.ReactNode;
}

/**
 * 页面外壳：可选头部 + 滚动内容区。
 * 页面本身不参与下钻动画 —— 动画由上层 AnimatePresence 施加在包裹层上。
 */
export const PageShell: React.FC<Props> = ({ title, subtitle, actions, bare, children }) => {
  if (bare) {
    return <div className={s.page}>{children}</div>;
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.titleGroup}>
          <h1 className={s.title}>{title}</h1>
          {subtitle ? <p className={s.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={s.headerActions}>{actions}</div> : null}
      </div>
      <div className={s.body}>{children}</div>
    </div>
  );
};
