import React from 'react';
import type { ArticleMemoryState } from './useArticleMemory';
import { Button } from '../../ui/Button';
import s from './ArticleMemory.module.css';

interface Props {
  state: ArticleMemoryState;
}

/** 全篇记忆：一个覆盖整篇（含标点与换行）的大输入框 */
export const FullQuiz: React.FC<Props> = ({ state }) => {
  const blank = state.blanks[0];

  return (
    <>
      <p className={s.hint}>凭记忆输入整篇文章，标点符号与换行也需要一并写出。</p>
      <textarea
        className={s.fullTextarea}
        value={state.userInputs[blank?.id] ?? ''}
        onChange={e => state.setUserInputs({ ...state.userInputs, [blank.id]: e.target.value })}
        placeholder="在此输入整篇内容……"
        autoFocus
      />
      <div style={{ marginTop: 16 }}>
        <Button variant="primary" onClick={state.submitFull}>
          提交
        </Button>
      </div>
    </>
  );
};
