import type { Variants } from 'framer-motion';
import { spring, tween } from './presets';

/**
 * 动效变体集。每种转场都有其"语义"，取值与理由见下方注释。
 *
 * 方向参数 dir：1 表示前进（向左推进），-1 表示后退。
 */

/** 标签页切换：同级关系 → 横向轴，位移要小，够读出方向即可 */
export const tabVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0, transition: spring.nav },
  exit: (dir: number) => ({ opacity: 0, x: dir * -16, transition: tween.in }),
};

/**
 * 下钻（列表 → 详情 → 记忆）：层级关系。
 * scale 只取 1.5%，读作"向前深入"；超过 3% 中文字形会在变换中明显闪烁。
 */
export const drillVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28, scale: 0.985 }),
  center: { opacity: 1, x: 0, scale: 1, transition: spring.nav },
  exit: (dir: number) => ({ opacity: 0, x: dir * -20, scale: 0.99, transition: tween.in }),
};

/** 记忆模式切换：八个模式是同级而非层级，横向滑动会暗示错误的层级关系 → 用交叉淡入 + 微上浮 */
export const swapVariants: Variants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0, transition: tween.out },
  exit: { opacity: 0, y: -6, transition: tween.in },
};

/** 结果揭示：流程的情绪落点，用更慢的弹簧 + 缩放给出分量 */
export const revealVariants: Variants = {
  enter: { opacity: 0, scale: 0.97, y: 12 },
  center: { opacity: 1, scale: 1, y: 0, transition: spring.soft },
  exit: { opacity: 0, scale: 0.98, y: 6, transition: tween.in },
};

/** 遮罩 */
export const overlayVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: tween.std },
  exit: { opacity: 0, transition: tween.in },
};

/** 弹窗：进入用弹簧"落位"，退出用补间求快 */
export const dialogVariants: Variants = {
  enter: { opacity: 0, y: 14, scale: 0.965 },
  center: { opacity: 1, y: 0, scale: 1, transition: spring.soft },
  exit: { opacity: 0, y: 8, scale: 0.975, transition: tween.in },
};

/** 网格项进出场；位置重排交给 layout，不用变体 */
export const gridItemVariants: Variants = {
  enter: { opacity: 0, scale: 0.94, y: -6 },
  center: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.9, transition: tween.in },
};

/** 闪卡换张 */
export const cardVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 56, scale: 0.96 }),
  center: { opacity: 1, x: 0, scale: 1, transition: spring.nav },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -56,
    scale: 0.96,
    position: 'absolute' as const,
    transition: tween.in,
  }),
};

/** 交错：父容器只负责编排时序 */
export const staggerParent: Variants = {
  center: { transition: { staggerChildren: 0.015, delayChildren: 0.04 } },
};

export const staggerChild: Variants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0, transition: tween.out },
};

/** 行内揭示（错误答案框、词条编辑器展开） */
export const collapseVariants: Variants = {
  enter: { height: 0, opacity: 0 },
  center: { height: 'auto', opacity: 1, transition: spring.soft },
  exit: { height: 0, opacity: 0, transition: tween.in },
};

/** Toast */
export const toastVariants: Variants = {
  enter: { opacity: 0, y: -8, scale: 0.96 },
  center: { opacity: 1, y: 0, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: tween.in },
};
