import React from 'react';
import { motion } from 'framer-motion';
import { spring } from '../../motion/presets';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { ArticleFlow } from './ArticleFlow';
import type { ArticleMemoryState } from './useArticleMemory';
import s from './ArticleMemory.module.css';
import flow from './ArticleFlow.module.css';

interface Props {
  state: ArticleMemoryState;
  onStart: (start: () => boolean, emptyMessage: string) => void;
}

const RATIO_PRESETS = [0.2, 0.4, 0.6, 0.8];

/** 部分记忆设置：随机比例 + 指定句子（Shift 连选） */
export const PartialMenu: React.FC<Props> = ({ state, onStart }) => {
  return (
    <>
      <div className={s.card} style={{ marginBottom: 16 }}>
        <h3 className={s.sectionTitle}>🎲 随机记忆</h3>
        <p className={s.hint}>
          按比例随机抽取句子作为空格。当前将抽取 {state.blankCount} 句（共{' '}
          {state.sentences.length} 句）。
        </p>
        <div className={s.row}>
          <TextField
            type="number"
            min={0.01}
            max={1}
            step={0.05}
            value={String(state.ratio)}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) state.setRatio(v);
            }}
            style={{ width: 96 }}
          />
          {RATIO_PRESETS.map(r => (
            <motion.div key={r} whileTap={{ scale: 0.96 }} transition={spring.snappy}>
              <Button
                variant={Math.abs(state.ratio - r) < 1e-9 ? 'primary' : 'subtle'}
                size="sm"
                onClick={() => state.setRatio(r)}
              >
                {Math.round(r * 100)}%
              </Button>
            </motion.div>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="primary" onClick={() => onStart(state.startRandom, '本文没有可记忆的句子')}>
              开始随机记忆
            </Button>
          </div>
        </div>
      </div>

      <div className={s.card}>
        <h3 className={s.sectionTitle}>✋ 指定记忆</h3>
        <p className={s.hint}>
          点击句子选择要考查的内容，可按住 Shift 点击进行范围选择。已选{' '}
          {state.customSelected.size} 句。
        </p>
        <div style={{ marginBottom: 12 }}>
          <ArticleFlow
            sentences={state.sentences}
            delimiters={state.delimiters}
            renderSentence={(sentence, idx) => {
              const selected = state.customSelected.has(idx);
              return (
                <span
                  className={`${flow.sentence} ${selected ? flow.sentenceSelected : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={e => state.handleSentenceClick(idx, e.shiftKey)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      state.handleSentenceClick(idx, e.shiftKey);
                    }
                  }}
                >
                  {selected ? '✓ ' : ''}
                  {sentence}
                </span>
              );
            }}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => onStart(state.startCustom, '请至少选择一个句子')}
          disabled={state.customSelected.size === 0}
        >
          开始指定记忆
        </Button>
      </div>
    </>
  );
};
