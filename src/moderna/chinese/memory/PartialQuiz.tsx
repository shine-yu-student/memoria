import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { spring } from '../../motion/presets';
import { Button } from '../../ui/Button';
import { ArticleFlow } from './ArticleFlow';
import { BlankInput } from './BlankInput';
import type { ArticleMemoryState } from './useArticleMemory';
import s from './ArticleMemory.module.css';
import flow from './ArticleFlow.module.css';

interface Props {
  state: ArticleMemoryState;
  title: string;
  onBackToMenu: () => void;
}

/** 随机 / 指定记忆共用的答题页。两者仅标题不同。 */
export const PartialQuiz: React.FC<Props> = ({ state, title, onBackToMenu }) => {
  const { blanks, blankIndices, graded, allCorrect, correctCount } = state;

  return (
    <>
      <div className={s.row} style={{ marginBottom: 12 }}>
        <h3 className={s.sectionTitle} style={{ margin: 0 }}>
          {title}
        </h3>
        <div className={s.headerSpacer} />
        <Button variant="ghost" size="sm" onClick={onBackToMenu}>
          返回菜单
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {graded ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={spring.snappy}
            className={`${s.banner} ${allCorrect ? s.bannerSuccess : s.bannerInfo}`}
            style={{ marginBottom: 12 }}
          >
            <span>{allCorrect ? '🎉 全部正确！' : `${correctCount} / ${blanks.length} 正确`}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={s.card}>
        <ArticleFlow
          sentences={state.sentences}
          delimiters={state.delimiters}
          renderSentence={(sentence, idx) => {
            const blankPos = blankIndices.indexOf(idx);
            if (blankPos === -1) {
              return <span>{sentence}</span>;
            }
            const blank = blanks[blankPos];

            if (graded) {
              return (
                <span
                  className={`${flow.blankDisplay} ${
                    blank.correctFlag ? flow.blankCorrect : flow.blankWrong
                  }`}
                  title={blank.correctFlag ? '' : `正确答案：${blank.correct}`}
                >
                  {blank.userInput}
                  {!blank.correctFlag && blank.userInput ? (
                    <span className={flow.answerHint}>正确：{blank.correct}</span>
                  ) : null}
                </span>
              );
            }

            return (
              <BlankInput
                value={state.userInputs[blank.id] ?? ''}
                onChange={v => state.setUserInputs({ ...state.userInputs, [blank.id]: v })}
              />
            );
          }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        {graded ? (
          <Button variant="primary" onClick={state.retryPartial}>
            重新作答
          </Button>
        ) : (
          <Button variant="primary" onClick={state.submitPartial}>
            提交
          </Button>
        )}
      </div>
    </>
  );
};
