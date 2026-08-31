import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../components/common/ThemeProvider';
import { spring } from '../motion/presets';
import s from './TopBar.module.css';

interface Props {
  onOpenSettings: () => void;
}

/**
 * 顶栏：品牌 + 主题开关 + 设置入口。
 *
 * 复用经典界面的 ThemeProvider —— 主题是跨两套界面共享的用户设置。
 */
export const TopBar: React.FC<Props> = ({ onOpenSettings }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={s.bar}>
      <div className={s.brand}>
        <span className={s.brandMark}>Memoria</span>
        <span className={s.brandTag}>Moderna · 实验性界面</span>
      </div>

      <div className={s.spacer} />

      <motion.button
        className={s.iconBtn}
        onClick={toggleTheme}
        whileTap={{ scale: 0.94 }}
        transition={spring.snappy}
        title={isDark ? '切换到浅色' : '切换到深色'}
        aria-label={isDark ? '切换到浅色' : '切换到深色'}
      >
        {isDark ? '☀️' : '🌙'}
      </motion.button>

      <motion.button
        className={s.iconBtn}
        onClick={onOpenSettings}
        whileTap={{ scale: 0.94 }}
        transition={spring.snappy}
        title="设置"
        aria-label="设置"
      >
        ⚙️
      </motion.button>
    </div>
  );
};
