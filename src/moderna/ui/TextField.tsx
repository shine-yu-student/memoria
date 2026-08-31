import React from 'react';
import s from './Field.module.css';

interface CommonProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  invalid?: boolean;
  mono?: boolean;
  className?: string;
}

type Props = CommonProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>;

export const TextField: React.FC<Props> = ({
  label,
  hint,
  invalid,
  mono,
  className,
  ...rest
}) => (
  <label className={`${s.wrap} ${className ?? ''}`}>
    {label ? <span className={s.label}>{label}</span> : null}
    <input
      className={[s.field, mono ? s.mono : '', invalid ? s.invalid : ''].filter(Boolean).join(' ')}
      {...rest}
    />
    {hint ? <span className={s.hint}>{hint}</span> : null}
  </label>
);
