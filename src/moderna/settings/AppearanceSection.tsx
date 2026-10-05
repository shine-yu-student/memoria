import React from 'react';
import { useTheme } from '../lib/ThemeProvider';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Switch } from '../ui/Switch';
import { useModernSettings, type MotionPref } from './ModernSettingsProvider';
import s from './SettingsPanel.module.css';

const MOTION_OPTIONS: { value: MotionPref; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'full', label: '完整动效' },
  { value: 'reduced', label: '减弱动效' },
];

export const AppearanceSection: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { hidePreviousSentences, setHidePreviousSentences, motion, setMotion } =
    useModernSettings();

  return (
    <div>
      <h3 className={s.section}>外观</h3>

      <div className={s.row}>
        <div className={s.rowText}>
          <span className={s.rowLabel}>颜色主题</span>
          <span className={s.rowDesc}>浅色 / 深色，选择会被记住</span>
        </div>
        <SegmentedControl
          id="theme"
          value={theme}
          onChange={v => {
            if (v !== theme) toggleTheme();
          }}
          options={[
            { value: 'light', label: '☀️ 浅色' },
            { value: 'dark', label: '🌙 深色' },
          ]}
        />
      </div>

      <div className={s.row}>
        <div className={s.rowText}>
          <span className={s.rowLabel}>动效强度</span>
          <span className={s.rowDesc}>
            跟随系统即尊重系统的「减少动态效果」偏好
          </span>
        </div>
        <SegmentedControl id="motion" value={motion} onChange={setMotion} options={MOTION_OPTIONS} />
      </div>

      <div className={s.row}>
        <div className={s.rowText}>
          <span className={s.rowLabel}>指导记忆：隐藏之前的句子</span>
          <span className={s.rowDesc}>指导记忆时只保留当前句子，减少干扰</span>
        </div>
        <Switch
          checked={hidePreviousSentences}
          onChange={setHidePreviousSentences}
          label={hidePreviousSentences ? '已隐藏' : '已显示'}
        />
      </div>
    </div>
  );
};
