import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ open, title, children, onClose, wide }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 用 ref 保存最新 onClose，避免父组件内联函数导致 keydown 监听频繁重绑
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // 简单 focus trap：Tab/Shift+Tab 在弹窗内循环
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // 打开时把焦点移入弹窗（子组件有 autoFocus 时优先）；关闭时恢复到打开前的焦点元素
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (dialog.querySelector('[autofocus]')) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) focusables[0].focus();
    }, 0);
    return () => {
      clearTimeout(t);
      prevFocus?.focus?.();
    };
  }, [open]);

  // 锁定背景滚动
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      style={styles.overlay}
      onClick={e => { if (e.target === overlayRef.current) onCloseRef.current(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ ...styles.dialog, ...(wide ? styles.dialogWide : {}) }}
      >
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div style={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    backgroundColor: 'var(--overlay)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'var(--bg-card)', borderRadius: 16,
    padding: 0, minWidth: 360, maxWidth: 480, width: '90%',
    boxShadow: 'var(--shadow-dialog)',
  },
  dialogWide: {
    maxWidth: 680,
    minWidth: 520,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border-default)',
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
    color: 'var(--text-muted)', lineHeight: 1, padding: '0 4px',
  },
  body: { padding: '20px' },
};
