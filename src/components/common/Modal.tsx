import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ open, title, children, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      style={styles.overlay}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div style={styles.dialog}>
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
