import React from 'react';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { useToast } from '../../ui/ToastProvider';
import { useConfirm } from '../../ui/ConfirmDialog';
import { useModernSettings } from '../../settings/ModernSettingsProvider';
import { ArticleFlow } from './ArticleFlow';
import { BlankInput } from './BlankInput';
import type { ArticleMemoryState } from './useArticleMemory';
import s from './ArticleMemory.module.css';
import flow from './ArticleFlow.module.css';

interface Props {
  state: ArticleMemoryState;
  onBackToSetup: () => void;
}

/**
 * 指导记忆答题页。
 *
 * 渲染规则逐条对齐经典界面（ArticleMemoryView.tsx:544-635）：
 * - idx > lastTargetIdx：恒为禁用占位
 * - idx < firstTargetIdx：仅当 hidePreviousSentences 时为占位，否则正常文本
 * - 区间内且是目标：检查前高亮，检查后输入框 / 批改显示
 * - 区间内非目标：正常文本
 */
export const GuidedQuiz: React.FC<Props> = ({ state, onBackToSetup }) => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { hidePreviousSentences } = useModernSettings();

  const indices = state.guidedStepIndices;
  const firstTargetIdx = indices.length > 0 ? Math.min(...indices) : -1;
  const lastTargetIdx = indices.length > 0 ? Math.max(...indices) : -1;
  const targetSet = new Set(indices);
  const stepCount = state.guidedConfig?.steps.length ?? 0;

  const placeholder = (key: string) => (
    <span key={key} className={flow.placeholder}>
      _
    </span>
  );

  const handleSubmit = () => {
    const { answered, correct } = state.handleGuidedSubmit();
    toast.info(`已批改 ${answered} 空，正确 ${correct} 空。`);
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: '清除进度',
      body: '将清除本文章的指导记忆进度（步骤与已填内容），配置保留。确定继续？',
      confirmLabel: '清除',
      danger: true,
    });
    if (ok) {
      state.resetGuidedProgress();
      toast.success('已清除进度');
    }
  };

  return (
    <>
      <div className={s.guidedHintBox} style={{ marginBottom: 12 }}>
        {state.guidedCurrentStep?.hint || ''}
      </div>

      <div className={s.card} style={{ marginBottom: 12 }}>
        <ArticleFlow
          sentences={state.sentences}
          delimiters={state.delimiters}
          renderSentence={(sentence, idx) => {
            if (lastTargetIdx >= 0 && idx > lastTargetIdx) return placeholder(`p-${idx}`);
            if (firstTargetIdx >= 0 && idx < firstTargetIdx && hidePreviousSentences) {
              return placeholder(`p-${idx}`);
            }

            if (!targetSet.has(idx)) return <span key={idx}>{sentence}</span>;

            const blank = state.guidedStepBlanks.find(b => b.idx === idx);

            if (!state.guidedChecked) {
              return (
                <span key={idx} className={flow.guidedTarget}>
                  {sentence}
                </span>
              );
            }

            if (state.guidedGraded && blank) {
              return (
                <span
                  key={idx}
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
                key={idx}
                value={state.guidedInputs[`guided-${idx}`] ?? ''}
                onChange={v => state.setGuidedInput(idx, v)}
              />
            );
          }}
        />
      </div>

      <div className={s.row}>
        <div className={s.stepNav}>
          <IconButton
            label="上一步"
            disabled={state.guidedEffectiveStep === 0}
            onClick={() => state.goToStep(state.guidedEffectiveStep - 1)}
          >
            ◀
          </IconButton>
          <span>
            第{' '}
            <input
              className={s.stepInput}
              type="number"
              min={1}
              max={Math.max(1, stepCount)}
              value={state.guidedEffectiveStep + 1}
              onChange={e => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n) && n >= 1 && n <= stepCount) state.goToStep(n - 1);
              }}
              style={{
                padding: '4px 6px',
                border: '1px solid var(--m-border)',
                borderRadius: 6,
                background: 'var(--m-bg-inset)',
                color: 'var(--m-text)',
              }}
            />{' '}
            / {stepCount} 步
          </span>
          <IconButton
            label="下一步"
            disabled={state.guidedEffectiveStep >= stepCount - 1}
            onClick={() => state.goToStep(state.guidedEffectiveStep + 1)}
          >
            ▶
          </IconButton>
        </div>

        <div className={s.headerSpacer} />

        <Button variant="ghost" size="sm" onClick={onBackToSetup}>
          配置
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void handleReset()}>
          清除进度
        </Button>
        {state.guidedChecked ? (
          <Button variant="primary" onClick={handleSubmit} disabled={state.guidedGraded}>
            {state.guidedGraded ? '已批改' : '提交检查'}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => state.setGuidedChecked(true)}>
            🔍 检查
          </Button>
        )}
      </div>
    </>
  );
};
