import React from 'react';
import { useTheme } from '../../components/common/ThemeProvider';
import { useUiMode } from '../../uiMode';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Switch } from '../ui/Switch';
import { useModernSettings, type MotionPref } from './ModernSettingsProvider';
import s from './SettingsPanel.module.css';

const MOTION_OPTIONS: { value: MotionPref; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'full', label: '完整动效' },
  { value: 'reduced', label: '减弱动效' },
];

const UI_OPTIONS = [
  { value: 'classic' as const, label: '经典' },
  { value: 'modern' as const, label: 'Moderna ✨' },
];

export const AppearanceSection: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [uiMode, setUiMode] = useUiMode();
  const { hidePreviousSentences, setHidePreviousSentences, motion, setMotion } =
    useModernSettings();

  return (
    <div>
      <h3 className={s.section}>外观</h3>

      <div className={s.row}>
        <div className={s.rowText}>
          <span className={s.rowLabel}>颜色主题</span>
          <span className={s.rowDesc}>与经典界面共享</span>
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
          <span className={s.rowDesc}>与经典界面共享同一设置</span>
        </div>
        <Switch
          checked={hidePreviousSentences}
          onChange={setHidePreviousSentences}
          label={hidePreviousSentences ? '已隐藏' : '已显示'}
        />
      </div>

      <h3 className={s.section} style={{ marginTop: 32 }}>
        实验
      </h3>

      <div className={s.row}>
        <div className={s.rowText}>
          <span className={s.rowLabel}>界面版本</span>
          <span className={s.rowDesc}>随时可切回，数据完全共享</span>
        </div>
        <SegmentedControl id="uimode" value={uiMode} onChange={setUiMode} options={UI_OPTIONS} />
      </div>

      <p className={s.experimentalNote}>
        Moderna 是实验性界面，功能与经典界面等价，正在持续完善。
        若遇到问题可随时切回经典界面；两种方式下的数据完全一致，切换不会丢失任何内容。
      </p>
    </div>
  );
};
