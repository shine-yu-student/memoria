import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import s from './NavRail.module.css';

export type ModernaTab = 'chinese' | 'english';

interface NavItem {
  key: ModernaTab;
  icon: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { key: 'chinese', icon: '📖', label: '语文' },
  { key: 'english', icon: '📚', label: '英语' },
];

interface Props {
  active: ModernaTab;
  onChange: (tab: ModernaTab) => void;
}

/**
 * 常驻 72px 图标导轨。
 *
 * 图标常显，无 hover 展开，因此无需防抖。
 * 激活指示条用 layoutId 在两个项之间平滑滑动。
 */
export const NavRail: React.FC<Props> = ({ active, onChange }) => (
  <LayoutGroup id="nav-rail">
    <div className={s.rail}>
      {ITEMS.map(item => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            className={`${s.item} ${isActive ? s.itemActive : ''}`}
            onClick={() => onChange(item.key)}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && <motion.span layoutId="nav-indicator" className={s.indicator} />}
            <span className={s.icon}>{item.icon}</span>
            <span className={s.label}>{item.label}</span>
          </button>
        );
      })}
      <div className={s.spacer} />
    </div>
  </LayoutGroup>
);
