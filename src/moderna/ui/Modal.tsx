import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionKit } from '../motion/useMotionKit';
import s from './Modal.module.css';

interface Props {
  open: boolean;
  title?: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * 现代界面弹窗。
 *
 * 必须 portal 到 document.body：framer 的 layout 投影在 fixed 祖先下会测错，
 * 而外壳本身是 fixed 高度的 Grid —— 弹窗留在树内会让内部动画测量失准。
 *
 * 焦点管理：打开时聚焦弹窗、Tab 循环、Esc 关闭，关闭后焦点归还触发元素。
 */
export const Modal: React.FC<Props> = ({ open, title, wide, footer, onClose, children }) => {
  const kit = useMotionKit();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 延后一帧聚焦，避开入场动画的第一帧
    const focusTimer = window.setTimeout(() => {
      const node = dialogRef.current;
      if (!node) return;
      const first = node.querySelector<HTMLElement>(
        'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
      );
      (first ?? node).focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const node = dialogRef.current;
      if (!node) return;
      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>(
          'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className={s.overlay}
          variants={kit.overlay}
          initial="enter"
          animate="center"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            className={`${s.dialog} ${wide ? s.dialogWide : ''}`}
            variants={kit.dialog}
            initial="enter"
            animate="center"
            exit="exit"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
          >
            {title !== undefined ? (
              <div className={s.header}>
                <h2 className={s.title}>{title}</h2>
                <button className={s.closeBtn} onClick={onClose} aria-label="关闭">
                  ✕
                </button>
              </div>
            ) : null}
            <div className={s.body}>{children}</div>
            {footer ? <div className={s.footer}>{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};
