import React from 'react';
import { motion } from 'framer-motion';
import { spring } from '../motion/presets';
import { IconButton } from '../ui/IconButton';
import s from './BookList.module.css';

export interface BookSummary {
  id: string;
  title: string;
  entries: { id: string; english: string; chinese: string }[];
}

interface Props {
  book: BookSummary;
  unit: string;
  onOpen: () => void;
  onDelete: () => void;
  selectMode?: boolean;
  /** 全选状态：true 全选 / false 全不选 / null 部分选（无全选按钮时传 null） */
  allSelected?: boolean | null;
  onToggleAll?: () => void;
}

/** 词书 / 句书卡片。两层结构：外层 layout，内层 hover/tap。 */
export const BookCard: React.FC<Props> = ({
  book,
  unit,
  onOpen,
  onDelete,
  selectMode,
  allSelected,
  onToggleAll,
}) => (
  <motion.div
    className={s.slot}
    layout="position"
    initial={{ opacity: 0, scale: 0.94, y: -6 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.13 } }}
    transition={spring.snappy}
  >
    <motion.div
      className={s.book}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={spring.snappy}
    >
      <span className={s.bookTitle}>{String(book.title ?? '')}</span>
      <span className={s.bookMeta}>
        {book.entries.length} {unit}
      </span>
    </motion.div>

    <span className={s.slotActions}>
      {selectMode && onToggleAll ? (
        <IconButton
          size="sm"
          variant="ghost"
          label={allSelected ? `取消全选 ${book.title}` : `全选 ${book.title}`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onToggleAll();
          }}
        >
          {allSelected ? '☑' : '☐'}
        </IconButton>
      ) : null}
      {!selectMode ? (
        <IconButton
          size="sm"
          variant="ghost"
          label={`删除 ${book.title}`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          🗑️
        </IconButton>
      ) : null}
    </span>
  </motion.div>
);
