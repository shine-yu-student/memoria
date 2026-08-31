import React from 'react';
import { DiffView } from '../../../utils/diff';
import { Chip } from '../../ui/Chip';
import { Button } from '../../ui/Button';
import type { ArticleMemoryState } from './useArticleMemory';
import s from './ArticleMemory.module.css';

interface Props {
  state: ArticleMemoryState;
  onBackToMenu: () => void;
}

/** 全篇记忆结果页。复用经典界面同一个 DiffView（src/utils/diff.tsx）。 */
export const FullResult: React.FC<Props> = ({ state, onBackToMenu }) => {
  const blank = state.blanks[0];
  const correct = blank?.correctFlag ?? false;

  return (
    <>
      <div className={s.row} style={{ marginBottom: 16 }}>
        <Chip tone={correct ? 'success' : 'danger'}>{correct ? '完全正确' : '存在差异'}</Chip>
        <Button variant="ghost" size="sm" onClick={onBackToMenu}>
          返回菜单
        </Button>
      </div>

      <div className={s.card}>
        <h3 className={s.sectionTitle}>原文与你的输入对照</h3>
        <div style={{ fontSize: 16, lineHeight: 2 }}>
          <DiffView original={blank?.correct ?? ''} userInput={blank?.userInput ?? ''} />
        </div>
      </div>
    </>
  );
};
