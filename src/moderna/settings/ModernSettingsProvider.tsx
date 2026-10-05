import React from 'react';
import { useLocalSetting } from '../lib/useLocalSetting';

export type MotionPref = 'system' | 'full' | 'reduced';

interface ModernSettings {
  /** 持久化在 localStorage，刷新与升级后保持 */
  hidePreviousSentences: boolean;
  setHidePreviousSentences: (v: boolean) => void;
  motion: MotionPref;
  setMotion: (v: MotionPref) => void;
}

const ModernSettingsContext = React.createContext<ModernSettings | null>(null);

const MOTION_VALUES: MotionPref[] = ['system', 'full', 'reduced'];

/**
 * 应用设置。
 *
 * hidePreviousSentences 沿用既有 key（memoria:hidePrevious）——
 * 它是"我的偏好"，不因版本升级而重置。
 * 侧栏位置与退出展开方式在当前布局下已无意义（常驻导轨，无悬浮展开），故不暴露。
 */
export const ModernSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideRaw, setHideRaw] = useLocalSetting<string>(
    'memoria:hidePrevious',
    'false',
    v => v === 'true' || v === 'false'
  );
  const [motion, setMotion] = useLocalSetting<MotionPref>(
    'memoria:motion',
    'system',
    v => (MOTION_VALUES as string[]).includes(v)
  );

  const setHidePreviousSentences = React.useCallback(
    (v: boolean) => setHideRaw(v ? 'true' : 'false'),
    [setHideRaw]
  );

  const value = React.useMemo<ModernSettings>(
    () => ({
      hidePreviousSentences: hideRaw === 'true',
      setHidePreviousSentences,
      motion,
      setMotion,
    }),
    [hideRaw, setHidePreviousSentences, motion, setMotion]
  );

  return (
    <ModernSettingsContext.Provider value={value}>{children}</ModernSettingsContext.Provider>
  );
};

export function useModernSettings(): ModernSettings {
  const ctx = React.useContext(ModernSettingsContext);
  if (!ctx) throw new Error('useModernSettings 必须在 ModernSettingsProvider 内使用');
  return ctx;
}
