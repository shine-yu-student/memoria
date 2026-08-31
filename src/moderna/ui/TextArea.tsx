import React from 'react';
import s from './Field.module.css';

interface Props extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  invalid?: boolean;
  mono?: boolean;
  className?: string;
}

export const TextArea: React.FC<Props> = ({
  label,
  hint,
  invalid,
  mono,
  className,
  ...rest
}) => (
  <label className={`${s.wrap} ${className ?? ''}`}>
    {label ? <span className={s.label}>{label}</span> : null}
    <textarea
      className={[s.field, s.area, mono ? s.mono : '', invalid ? s.invalid : '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
    {hint ? <span className={s.hint}>{hint}</span> : null}
  </label>
);
