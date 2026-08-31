import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { spring } from '../motion/presets';
import s from './Button.module.css';

interface Props extends Omit<HTMLMotionProps<'button'>, 'className'> {
  variant?: 'secondary' | 'subtle' | 'ghost';
  size?: 'sm' | 'md';
  /** 无障碍必需：纯图标按钮必须提供可读名称 */
  label: string;
  className?: string;
}

/** 正方形图标按钮。label 必填，用于 aria-label 与 title。 */
export const IconButton: React.FC<Props> = ({
  variant = 'ghost',
  size = 'md',
  label,
  className,
  disabled,
  children,
  ...rest
}) => (
  <motion.button
    className={[s.base, s[variant], size === 'sm' ? s.sm : s.md, className ?? '']
      .filter(Boolean)
      .join(' ')}
    style={{
      padding: 0,
      width: size === 'sm' ? 28 : 34,
      height: size === 'sm' ? 28 : 34,
    }}
    whileTap={disabled ? undefined : { scale: 0.93 }}
    transition={spring.snappy}
    disabled={disabled}
    aria-label={label}
    title={label}
    {...rest}
  >
    {children}
  </motion.button>
);
