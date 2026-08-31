import React from 'react';
import s from './Shell.module.css';

interface Props {
  topBar: React.ReactNode;
  rail: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 现代界面框架。CSS Grid 三区（顶栏 / 导轨 / 主区）。
 *
 * 顶栏用 sticky 而非 fixed：framer 的 layout 投影在 fixed 祖先下会测错。
 */
export const Shell: React.FC<Props> = ({ topBar, rail, children }) => (
  <div className={s.shell}>
    <header className={s.topbar}>{topBar}</header>
    <nav className={s.rail}>{rail}</nav>
    <main className={s.main}>{children}</main>
  </div>
);
