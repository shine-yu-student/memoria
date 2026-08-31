import React from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { spring } from '../motion/presets';
import s from './Controls.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface Props<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  /** 同一页面多个分段控件时必须唯一，否则 layoutId 会互相抢 */
  id?: string;
  className?: string;
}

/** 分段控件。激活滑块用 layoutId 在选项间平滑滑动。 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  id = 'seg',
  className,
}: Props<T>) {
  return (
    <LayoutGroup id={id}>
      <div className={`${s.segmented} ${className ?? ''}`} role="tablist">
        {options.map(opt => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              className={`${s.segment} ${active ? s.segmentActive : ''}`}
              onClick={() => onChange(opt.value)}
              role="tab"
              aria-selected={active}
            >
              {active && <motion.span layoutId={`${id}-thumb`} className={s.thumb} />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
