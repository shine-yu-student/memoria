import React, { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionKit } from '../motion/useMotionKit';
import s from './Toast.module.css';

export type ToastTone = 'info' | 'success' | 'error' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
  info: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 3200;
/** 同一消息在此窗口内重复触发时去重，规避 StrictMode 双调用导致的双份提示 */
const DEDUPE_MS = 400;

const TONE_ICON: Record<ToastTone, string> = {
  info: 'ℹ️',
  success: '✅',
  error: '⛔',
  warning: '⚠️',
};

const TONE_CLASS: Record<ToastTone, string> = {
  info: '',
  success: s.toastSuccess,
  error: s.toastError,
  warning: s.toastWarning,
};

/**
 * Toast 宿主 —— 替代 window.alert。
 *
 * 这不是纯美化：alert 会阻塞主线程，也就阻塞 requestAnimationFrame，
 * 在 alert 打开期间 framer 的动画根本无法推进，会卡在半途。
 *
 * 必须挂载在所有 AnimatePresence 边界之外，否则关闭 Toast 会卷入页面转场。
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const kit = useMotionKit();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const lastRef = useRef<{ message: string; at: number } | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts(list => list.filter(t => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const now = Date.now();
      const last = lastRef.current;
      if (last && last.message === message && now - last.at < DEDUPE_MS) return;
      lastRef.current = { message, at: now };

      const id = nextIdRef.current++;
      setToasts(list => [...list, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      info: (m: string) => show(m, 'info'),
      success: (m: string) => show(m, 'success'),
      error: (m: string) => show(m, 'error'),
      warning: (m: string) => show(m, 'warning'),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className={s.host}>
          <AnimatePresence initial={false}>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                layout
                className={`${s.toast} ${TONE_CLASS[t.tone]}`}
                variants={kit.toast}
                initial="enter"
                animate="center"
                exit="exit"
                onClick={() => dismiss(t.id)}
                role="status"
              >
                <span className={s.icon}>{TONE_ICON[t.tone]}</span>
                <span className={s.message}>{t.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast 必须在 ToastProvider 内使用');
  return ctx;
}
