import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { spring } from '../motion/presets';
import s from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger' | 'dangerGhost';
type Size = 'sm' | 'md' | 'lg';

/**
 * 用 framer 的 HTMLMotionProps 而非 React.ButtonHTMLAttributes：
 * onAnimationStart / onDragEnd 等属性在两者中签名不同，混用会类型冲突。
 */
interface Props extends Omit<HTMLMotionProps<'button'>, 'className'> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  primary: s.primary,
  secondary: s.secondary,
  subtle: s.subtle,
  ghost: s.ghost,
  danger: s.danger,
  dangerGhost: s.dangerGhost,
};

const SIZES: Record<Size, string> = {
  sm: s.sm,
  md: s.md,
  lg: s.lg,
};

/**
 * 现代界面按钮。
 *
 * 按下反馈用 framer 的 whileTap（spring），而非 CSS :active —— CSS 里一旦
 * 对 transform 声明 transition，就会与 framer 的逐帧改写打架。
 */
export const Button: React.FC<Props> = ({
  variant = 'secondary',
  size = 'md',
  className,
  disabled,
  ...rest
}) => (
  <motion.button
    className={[s.base, VARIANTS[variant], SIZES[size], className ?? ''].filter(Boolean).join(' ')}
    whileTap={disabled ? undefined : { scale: 0.97 }}
    transition={spring.snappy}
    disabled={disabled}
    {...rest}
  />
);
