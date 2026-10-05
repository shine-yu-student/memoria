import React, { useEffect, useRef } from 'react';
import s from './ArticleFlow.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 随内容增高的行内填空输入框。
 *
 * rows={1} + overflow:hidden 会把用户输入的长句裁掉，
 * 因此这里按 scrollHeight 自适应高度。
 */
export const BlankInput: React.FC<Props> = ({ value, onChange, disabled, placeholder }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(resize, [value]);

  return (
    <span className={s.blank}>
      <textarea
        ref={ref}
        className={s.blankInput}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => {
          onChange(e.target.value);
          resize();
        }}
      />
    </span>
  );
};
