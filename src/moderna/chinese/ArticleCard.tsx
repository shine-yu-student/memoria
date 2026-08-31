import React from 'react';
import { motion } from 'framer-motion';
import type { Article } from '../../types';
import { splitIntoSentences } from '../../utils/splitter';
import { spring } from '../motion/presets';
import { IconButton } from '../ui/IconButton';
import s from './ArticleList.module.css';

interface Props {
  article: Article;
  onOpen: () => void;
  onDelete: () => void;
}

/**
 * 文章卡片。
 *
 * 两层结构是刻意的：外层承担 layout 与进出场，内层承担 hover/tap 变换 ——
 * 二者放在同一元素上会互相打架产生抖动循环。
 *
 * 外层用 div + role="button" 而非真 button：内部还有一个删除按钮，
 * 嵌套 button 是非法 HTML。
 */
export const ArticleCard: React.FC<Props> = ({ article, onOpen, onDelete }) => {
  const sentenceCount = splitIntoSentences(article.content).length;
  const charCount = article.content.replace(/\s/g, '').length;

  return (
    <motion.div
      className={s.cardSlot}
      layout="position"
      initial={{ opacity: 0, scale: 0.94, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.13 } }}
      transition={spring.snappy}
    >
      <motion.div
        className={s.card}
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
        <span className={s.cardTitle}>{String(article.title ?? '')}</span>
        <span className={s.cardPreview}>
          {article.content ? article.content.replace(/\s+/g, ' ').slice(0, 60) : '（暂无内容）'}
        </span>
        <span className={s.cardMeta}>
          <span>{sentenceCount} 句</span>
          <span>·</span>
          <span>{charCount} 字</span>
        </span>
      </motion.div>

      <span className={s.cardDelete}>
        <IconButton
          size="sm"
          variant="ghost"
          label={`删除文章 ${article.title}`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          🗑️
        </IconButton>
      </span>
    </motion.div>
  );
};
