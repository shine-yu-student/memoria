import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { spring } from '../motion/presets';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import { useConfirm } from '../ui/ConfirmDialog';
import s from './BookDetail.module.css';

export interface Entry {
  id: string;
  english: string;
  chinese: string;
}

interface Props {
  entry: Entry;
  unit: string;
  selected?: boolean;
  onToggleSelect?: () => void;
  onSave: (english: string, chinese: string) => void;
  onDelete: () => void;
}

/**
 * 词/句条目。点击就地展开编辑（framer layout），而非旧版的 fixed 浮层。
 *
 * 保留的语义：
 * - 任一字段 blur 即保存
 * - 只填了一半时确认后再丢弃，避免静默丢失
 * - 删除需确认
 */
export const EntryChip: React.FC<Props> = ({
  entry,
  unit,
  selected,
  onToggleSelect,
  onSave,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const [en, setEn] = useState(entry.english);
  const [zh, setZh] = useState(entry.chinese);
  const { confirm } = useConfirm();

  // 外部数据变化时同步（如全量导入后重新加载）
  useEffect(() => {
    if (!open) {
      setEn(entry.english);
      setZh(entry.chinese);
    }
  }, [entry.english, entry.chinese, open]);

  const latest = useRef({ en, zh });
  latest.current = { en, zh };

  const commit = () => {
    const e = latest.current.en.trim();
    const c = latest.current.zh.trim();
    if (e && c) onSave(e, c);
  };

  const close = async () => {
    const e = latest.current.en.trim();
    const c = latest.current.zh.trim();
    if (e && c) {
      onSave(e, c);
    } else if (e || c) {
      const ok = await confirm({
        title: '放弃修改',
        body: `当前编辑内容不完整（英文或中文为空），确定放弃修改？`,
        confirmLabel: '放弃',
        danger: true,
      });
      if (!ok) return;
      setEn(entry.english);
      setZh(entry.chinese);
    }
    setOpen(false);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `删除${unit}`,
      body: `确定删除「${entry.english}」？`,
      confirmLabel: '删除',
      danger: true,
    });
    if (ok) onDelete();
  };

  return (
    <motion.div
      layout
      transition={spring.nav}
      className={`${s.chip} ${selected ? s.chipSelected : ''}`}
      onClick={() => {
        if (onToggleSelect) onToggleSelect();
        else if (!open) setOpen(true);
      }}
    >
      <motion.span layout="position" className={s.chipLabel}>
        {entry.english}
      </motion.span>
      {entry.chinese ? (
        <motion.span layout="position" className={s.chipMeaning}>
          {entry.chinese}
        </motion.span>
      ) : null}

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="editor"
            className={s.editorWrap}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.soft}
          >
            <div
              className={s.editor}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
            >
              <TextField
                value={en}
                autoFocus
                placeholder="英文"
                onChange={e => setEn(e.target.value)}
                onBlur={commit}
              />
              <TextField
                value={zh}
                placeholder="中文"
                onChange={e => setZh(e.target.value)}
                onBlur={commit}
              />
              <div className={s.editorActions}>
                <Button size="sm" variant="dangerGhost" onClick={() => void handleDelete()}>
                  删除
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void close()}>
                  关闭
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
