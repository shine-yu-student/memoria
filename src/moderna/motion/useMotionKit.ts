import { useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { tween } from './presets';
import * as V from './variants';

/**
 * 无障碍：系统开启「减少动态效果」时的退化变体。
 *
 * <MotionConfig reducedMotion="user"> 已会全局跳过 transform/layout 动画，
 * 但方向型变体（下钻、闪卡换张）若完全不动，用户会失去"我在往哪走"的线索。
 * 这里保留极短的透明度过渡，去掉位移与缩放。
 */

const FADE_IN = { duration: 0.12 };
const FADE_OUT = { duration: 0.1 };

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: FADE_IN },
  exit: { opacity: 0, transition: FADE_OUT },
};

const fadeOverlay: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: FADE_IN },
  exit: { opacity: 0, transition: FADE_OUT },
};

export interface MotionKit {
  reduced: boolean;
  tab: Variants;
  drill: Variants;
  swap: Variants;
  reveal: Variants;
  overlay: Variants;
  dialog: Variants;
  gridItem: Variants;
  card: Variants;
  collapse: Variants;
  toast: Variants;
  /** 交错编排：reduced 时关闭 stagger */
  stagger: (enabled: boolean) => Variants | undefined;
}

export function useMotionKit(): MotionKit {
  const reduced = useReducedMotion() ?? false;

  if (reduced) {
    return {
      reduced,
      tab: fadeVariants,
      drill: fadeVariants,
      swap: fadeVariants,
      reveal: fadeVariants,
      overlay: fadeOverlay,
      dialog: fadeVariants,
      gridItem: fadeVariants,
      card: fadeVariants,
      collapse: fadeVariants,
      toast: fadeVariants,
      stagger: () => undefined,
    };
  }

  return {
    reduced,
    tab: V.tabVariants,
    drill: V.drillVariants,
    swap: V.swapVariants,
    reveal: V.revealVariants,
    overlay: V.overlayVariants,
    dialog: V.dialogVariants,
    gridItem: V.gridItemVariants,
    card: V.cardVariants,
    collapse: V.collapseVariants,
    toast: V.toastVariants,
    stagger: enabled => (enabled ? V.staggerParent : undefined),
  };
}

export { tween };
