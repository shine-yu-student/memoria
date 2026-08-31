import React from 'react';
import { motion } from 'framer-motion';
import { spring } from '../motion/presets';
import s from './Surfaces.module.css';

interface Props {
  /** 0–1 */
  value: number;
  className?: string;
}

export const ProgressBar: React.FC<Props> = ({ value, className }) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`${s.progressTrack} ${className ?? ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <motion.div
        className={s.progressFill}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={spring.glide}
      />
    </div>
  );
};
