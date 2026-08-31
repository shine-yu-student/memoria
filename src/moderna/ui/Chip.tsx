import React from 'react';
import s from './Surfaces.module.css';

type Tone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning';

interface Props extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'className'> {
  tone?: Tone;
  className?: string;
}

const TONES: Record<Tone, string> = {
  neutral: '',
  accent: s.chipAccent,
  success: s.chipSuccess,
  danger: s.chipDanger,
  warning: s.chipWarning,
};

export const Chip: React.FC<Props> = ({ tone = 'neutral', className, children, ...rest }) => (
  <span className={[s.chip, TONES[tone], className ?? ''].filter(Boolean).join(' ')} {...rest}>
    {children}
  </span>
);
