import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import s from './Confirm.module.css';

export interface ConfirmOptions {
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

interface ConfirmApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = React.createContext<ConfirmApi | null>(null);

/**
 * Promise 式确认框 —— 替代 window.confirm。
 * 与 Toast 同理：原生 confirm 阻塞主线程，会冻住进行中的 framer 动画。
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<Pending | null>(null);
  // 连续调用时后一个会覆盖前一个；被覆盖的那次必须以 false 结算，否则调用方的 await 永不返回
  const pendingRef = useRef<Pending | null>(null);

  const settle = useCallback((p: Pending | null, ok: boolean) => {
    if (p) p.resolve(ok);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) => {
      settle(pendingRef.current, false);
      return new Promise<boolean>(resolve => {
        const next: Pending = { ...opts, resolve };
        pendingRef.current = next;
        setPending(next);
      });
    },
    [settle]
  );

  const api = useMemo<ConfirmApi>(() => ({ confirm }), [confirm]);

  const close = useCallback(
    (ok: boolean) => {
      const p = pendingRef.current;
      pendingRef.current = null;
      setPending(null);
      settle(p, ok);
    },
    [settle]
  );

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Modal
        open={pending !== null}
        title={pending?.title ?? ''}
        onClose={() => close(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              {pending?.cancelLabel ?? '取消'}
            </Button>
            <Button
              variant={pending?.danger ? 'danger' : 'primary'}
              onClick={() => close(true)}
            >
              {pending?.confirmLabel ?? '确定'}
            </Button>
          </>
        }
      >
        <div className={s.body}>{pending?.body}</div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export function useConfirm(): ConfirmApi {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm 必须在 ConfirmProvider 内使用');
  return ctx;
}
