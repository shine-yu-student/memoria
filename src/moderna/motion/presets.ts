import type { Transition } from 'framer-motion';

/**
 * 动效时序预设 —— 全应用唯一真源。
 *
 * 想调整「这个应用动起来是什么手感」，改这个文件即可。
 * styles/tokens.css 里的 --m-dur-* / --m-ease-* 与本文件镜像，改一处需同步另一处。
 *
 * strict 模式下 easing 元组必须显式断言为四元组，否则 number[] 无法赋给 framer 的类型。
 */

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN: [number, number, number, number] = [0.4, 0, 1, 1];
const EASE_STD: [number, number, number, number] = [0.4, 0, 0.2, 1];

/** 弹簧：用于有"落位"感的交互（进入、展开、指示器滑动） */
export const spring = {
  /** ~170ms —— 点击、小元件、chip */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 } as Transition,
  /** ~240ms —— 标签页切换、下钻、卡片换张 */
  nav: { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as Transition,
  /** ~320ms —— 弹窗、抽屉、内联展开 */
  soft: { type: 'spring', stiffness: 280, damping: 28, mass: 0.9 } as Transition,
  /** ~420ms —— 进度条等大位移连续动画 */
  glide: { type: 'spring', stiffness: 180, damping: 26, mass: 1 } as Transition,
} as const;

/** 补间：用于退场。"没人想等一个弹窗慢慢关掉" */
export const tween = {
  /** 退场一律用快速补间，避免弹簧在卸载时的回弹 */
  in: { duration: 0.13, ease: EASE_IN } as Transition,
  out: { duration: 0.22, ease: EASE_OUT } as Transition,
  std: { duration: 0.18, ease: EASE_STD } as Transition,
} as const;
