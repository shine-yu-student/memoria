import React from 'react';
import { MotionConfig, type ReducedMotionConfig } from 'framer-motion';
import type { MotionPref } from '../settings/ModernSettingsProvider';

/** framer 的取值是 user|always|never，与应用内的 system|full|reduced 一一对应 */
const REDUCED_MOTION: Record<MotionPref, ReducedMotionConfig> = {
  system: 'user',
  full: 'never',
  reduced: 'always',
};

/**
 * 动效根节点。
 *
 * 'system' 让 framer 自动尊重系统的「减少动态效果」偏好：
 * 跳过 transform / layout 动画，只保留透明度 —— 零逐组件成本。
 * 'full' / 'reduced' 是应用内的手动覆盖。
 */
export const MotionRoot: React.FC<{ preference: MotionPref; children: React.ReactNode }> = ({
  preference,
  children,
}) => <MotionConfig reducedMotion={REDUCED_MOTION[preference]}>{children}</MotionConfig>;
