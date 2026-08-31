import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Article } from '../../../types';
import { useMotionKit } from '../../motion/useMotionKit';
import { IconButton } from '../../ui/IconButton';
import { useToast } from '../../ui/ToastProvider';
import { useArticleMemory } from './useArticleMemory';
import { MemoryMenu } from './MemoryMenu';
import { FullQuiz } from './FullQuiz';
import { FullResult } from './FullResult';
import { PartialMenu } from './PartialMenu';
import { PartialQuiz } from './PartialQuiz';
import { GuidedSetup } from './GuidedSetup';
import { GuidedQuiz } from './GuidedQuiz';
import s from './ArticleMemory.module.css';

interface Props {
  article: Article;
  onBack: () => void;
}

const TITLES: Record<string, string> = {
  menu: '选择记忆方式',
  full: '全篇记忆',
  result: '记忆结果',
  'partial-menu': '部分记忆',
  'partial-random': '🎲 随机记忆',
  'partial-custom': '✋ 指定记忆',
  'guided-menu': '🎯 指导记忆',
  guided: '🎯 指导记忆',
};

export const ArticleMemory: React.FC<Props> = ({ article, onBack }) => {
  const state = useArticleMemory(article);
  const kit = useMotionKit();
  const toast = useToast();

  // Esc 退一级：菜单层直接回列表，其余回菜单
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (state.mode === 'menu') onBack();
      else if (state.mode === 'guided') state.setMode('guided-menu');
      else if (state.mode === 'full' || state.mode === 'result') state.setMode('menu');
      else state.setMode('menu');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.mode, state, onBack]);

  /** 统一的启动守卫：开始条件不满足时用 Toast 提示（替代 alert） */
  const startOrWarn = (start: () => boolean, message: string) => {
    if (!start()) toast.warning(message);
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <IconButton
          label={state.mode === 'menu' ? '返回文章列表' : '返回'}
          onClick={() => {
            if (state.mode === 'menu') onBack();
            else state.setMode('menu');
          }}
        >
          ←
        </IconButton>
        <h2 className={s.headerTitle}>{TITLES[state.mode] ?? '记忆'}</h2>
        <div className={s.headerSpacer} />
      </div>

      <div className={s.scrollArea}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.mode}
            variants={state.mode === 'result' ? kit.reveal : kit.swap}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {state.mode === 'menu' && <MemoryMenu state={state} onStart={startOrWarn} />}

            {state.mode === 'full' && <FullQuiz state={state} />}

            {state.mode === 'result' && (
              <FullResult state={state} onBackToMenu={() => state.setMode('menu')} />
            )}

            {state.mode === 'partial-menu' && (
              <PartialMenu state={state} onStart={startOrWarn} />
            )}

            {(state.mode === 'partial-random' || state.mode === 'partial-custom') && (
              <PartialQuiz
                state={state}
                title={TITLES[state.mode]}
                onBackToMenu={() => state.setMode('menu')}
              />
            )}

            {state.mode === 'guided-menu' && (
              <GuidedSetup article={article} state={state} />
            )}

            {state.mode === 'guided' && (
              <GuidedQuiz state={state} onBackToSetup={() => state.setMode('guided-menu')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
