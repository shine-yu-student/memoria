import React from 'react';
import { motion } from 'framer-motion';
import { spring } from '../motion/presets';
import s from './Controls.module.css';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch: React.FC<Props> = ({ checked, onChange, label, description }) => (
  <div
    className={s.switchRow}
    onClick={() => onChange(!checked)}
    role="switch"
    aria-checked={checked}
    tabIndex={0}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    }}
  >
    <div className={`${s.switchTrack} ${checked ? s.switchTrackOn : ''}`}>
      <motion.div
        className={s.switchKnob}
        initial={false}
        animate={{ x: checked ? 18 : 0 }}
        transition={spring.snappy}
      />
    </div>
    {label || description ? (
      <div className={s.switchText}>
        {label ? <span className={s.switchLabel}>{label}</span> : null}
        {description ? <span className={s.switchDesc}>{description}</span> : null}
      </div>
    ) : null}
  </div>
);
