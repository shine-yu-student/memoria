import React from 'react';
import { motion } from 'framer-motion';
import { spring } from '../../motion/presets';
import type { ArticleMemoryState } from './useArticleMemory';
import s from './ArticleMemory.module.css';

interface Props {
  state: ArticleMemoryState;
  onStart: (start: () => boolean, emptyMessage: string) => void;
}

/** 模式选择。三张卡片。 */
export const MemoryMenu: React.FC<Props> = ({ state, onStart }) => {
  const modes = [
    {
      icon: '📝',
      title: '全篇记忆',
      desc: '不提供任何提示，凭记忆输入整篇文章。',
      run: () => onStart(state.startFull, '文章内容为空，请先在详情页输入文章正文'),
    },
    {
      icon: '📄',
      title: '部分记忆',
      desc: '只记忆文章中部分句子。',
      run: () => {
        if (state.sentences.length === 0) {
          onStart(() => false, '本文没有可记忆的句子');
          return;
        }
        state.setMode('partial-menu');
      },
    },
    {
      icon: '🎯',
      title: '指导记忆',
      desc: '按照配置步骤逐步记忆文章，适合初次接触的文言文。',
      run: () => state.setMode('guided-menu'),
    },
  ];

  return (
    <div className={s.modeList}>
      {modes.map(m => (
        <motion.button
          key={m.title}
          className={s.modeCard}
          onClick={m.run}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={spring.snappy}
        >
          <span className={s.modeIcon}>{m.icon}</span>
          <span className={s.modeText}>
            <span className={s.modeTitle}>{m.title}</span>
            <span className={s.modeDesc}>{m.desc}</span>
          </span>
          <span className={s.modeArrow}>›</span>
        </motion.button>
      ))}
    </div>
  );
};
