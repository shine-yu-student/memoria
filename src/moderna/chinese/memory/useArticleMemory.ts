import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Article, BlankItem, GuideConfig } from '../../../types';
import { uid } from '../../../types';
import { extractDelimiters, pickRandomIndices, splitIntoSentences } from '../../../utils/splitter';
import {
  clearGuidedProgress,
  loadGuidedConfig,
  loadGuidedInputs,
  loadGuidedStep,
  saveGuidedConfig,
  saveGuidedInputs,
  saveGuidedStep,
} from '../../lib/guidedStorage';
import { sanitizeGuideConfig } from '../../lib/sanitizeGuideConfig';

export type MemoryMode =
  | 'menu'
  | 'full'
  | 'partial-menu'
  | 'partial-random'
  | 'partial-custom'
  | 'guided-menu'
  | 'guided'
  | 'result';

const DEFAULT_RATIO = 0.4;

/**
 * 文章记忆的全部非展示状态。
 *
 * 行为契约严格对齐经典界面 ArticleMemoryView.tsx，尤其是：
 * - 批改一律 `(输入).trim() === (正确).trim()` —— 仅 trim，不做标点归一化
 * - 句子的切分与分隔符提取始终基于 article.content，绝不读持久化的 article.sentences
 * - 随机空格数的钳制顺序：先钳 ratio 到 [0.01,1]，再 ceil，最后 max(1, …)
 * - 指定记忆的 Shift 范围选择只增不减
 */
export function useArticleMemory(article: Article) {
  const [mode, setMode] = useState<MemoryMode>('menu');
  const [blanks, setBlanks] = useState<BlankItem[]>([]);
  /** 与 blanks 平行，必须保持升序：PartialQuiz 依赖 indexOf 查找 */
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [customSelected, setCustomSelected] = useState<Set<number>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState(false);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);

  const [guidedConfig, setGuidedConfig] = useState<GuideConfig | null>(() =>
    loadGuidedConfig(article.id)
  );
  const [guidedStep, setGuidedStep] = useState<number>(() => loadGuidedStep(article.id));
  const [guidedInputs, setGuidedInputs] = useState<Record<string, string>>(() =>
    loadGuidedInputs(article.id)
  );
  const [guidedGraded, setGuidedGraded] = useState(false);
  const [guidedChecked, setGuidedChecked] = useState(false);

  /** 句子必须由正文实时切分 —— 这是标点相邻 bug 的防线 */
  const sentences = useMemo(() => splitIntoSentences(article.content), [article.content]);
  const delimiters = useMemo(() => extractDelimiters(article.content, sentences), [
    article.content,
    sentences,
  ]);

  /* ===== 指导记忆持久化（与经典界面同键、同结构、同样无条件写 inputs） ===== */

  useEffect(() => {
    saveGuidedConfig(article.id, guidedConfig);
  }, [article.id, guidedConfig]);

  useEffect(() => {
    saveGuidedStep(article.id, guidedStep);
  }, [article.id, guidedStep]);

  useEffect(() => {
    saveGuidedInputs(article.id, guidedInputs);
  }, [article.id, guidedInputs]);

  /* ===== 通用批改 ===== */

  const grade = useCallback((input: string, correct: string) => input.trim() === correct.trim(), []);

  /* ===== 全篇记忆 ===== */

  const startFull = useCallback(() => {
    if (!article.content || !article.content.trim()) return false;
    const blank: BlankItem = {
      id: uid(),
      correct: article.content,
      userInput: '',
      graded: false,
      correctFlag: false,
    };
    setBlanks([blank]);
    setUserInputs({ [blank.id]: '' });
    setGraded(false);
    setMode('full');
    return true;
  }, [article.content]);

  const submitFull = useCallback(() => {
    const updated = blanks.map(b => ({
      ...b,
      userInput: userInputs[b.id] || '',
      graded: true,
      correctFlag: grade(userInputs[b.id] || '', b.correct),
    }));
    setBlanks(updated);
    setMode('result');
  }, [blanks, userInputs, grade]);

  /* ===== 部分记忆 ===== */

  const blankCount = useMemo(() => {
    const clamped = Math.min(1, Math.max(0.01, ratio));
    return Math.max(1, Math.ceil(sentences.length * clamped));
  }, [sentences.length, ratio]);

  const startRandom = useCallback(() => {
    if (sentences.length === 0) return false;
    const indices = pickRandomIndices(sentences.length, blankCount);
    const items = indices.map(idx => ({
      id: uid(),
      correct: sentences[idx],
      userInput: '',
      graded: false,
      correctFlag: false,
    }));
    setBlanks(items);
    setBlankIndices(indices);
    setUserInputs(Object.fromEntries(items.map(i => [i.id, ''])));
    setGraded(false);
    setMode('partial-random');
    return true;
  }, [sentences, blankCount]);

  /** Shift 范围选择：只增不减；点锚点自身则落到切换分支（与经典界面一致） */
  const handleSentenceClick = useCallback((idx: number, shiftKey: boolean) => {
    setCustomSelected(prev => {
      const next = new Set(prev);
      if (shiftKey && lastClickedIndex !== null && lastClickedIndex !== idx) {
        const start = Math.min(lastClickedIndex, idx);
        const end = Math.max(lastClickedIndex, idx);
        for (let i = start; i <= end; i++) next.add(i);
      } else {
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
      }
      return next;
    });
    setLastClickedIndex(idx);
  }, [lastClickedIndex]);

  const startCustom = useCallback(() => {
    if (customSelected.size === 0) return false;
    const indices = Array.from(customSelected).sort((a, b) => a - b);
    const items = indices.map(idx => ({
      id: uid(),
      correct: sentences[idx],
      userInput: '',
      graded: false,
      correctFlag: false,
    }));
    setBlanks(items);
    setBlankIndices(indices);
    setUserInputs(Object.fromEntries(items.map(i => [i.id, ''])));
    setGraded(false);
    setMode('partial-custom');
    return true;
  }, [customSelected, sentences]);

  const submitPartial = useCallback(() => {
    setBlanks(list =>
      list.map(b => ({
        ...b,
        userInput: userInputs[b.id] || '',
        graded: true,
        correctFlag: grade(userInputs[b.id] || '', b.correct),
      }))
    );
    setGraded(true);
  }, [userInputs, grade]);

  /** 重新作答：清空全部空格（含已答对的）—— 是"重做整组"而非"重做错题" */
  const retryPartial = useCallback(() => {
    setUserInputs(Object.fromEntries(blanks.map(b => [b.id, ''])));
    setBlanks(list =>
      list.map(b => ({ ...b, userInput: '', graded: false, correctFlag: false }))
    );
    setGraded(false);
  }, [blanks]);

  const allCorrect = graded && blanks.every(b => b.correctFlag);
  const correctCount = graded ? blanks.filter(b => b.correctFlag).length : 0;

  /* ===== 指导记忆 ===== */

  const guidedEffectiveStep =
    guidedConfig && guidedConfig.steps.length > 0
      ? Math.min(Math.max(guidedStep, 0), guidedConfig.steps.length - 1)
      : 0;

  const guidedCurrentStep = guidedConfig?.steps[guidedEffectiveStep];

  /** 过滤越界/非法索引，防止渲染崩溃（含步骤数据损坏的防御） */
  const guidedStepIndices = useMemo(
    () =>
      (guidedCurrentStep?.sentenceIndices || []).filter(
        idx => Number.isInteger(idx) && idx >= 0 && idx < sentences.length
      ),
    [guidedCurrentStep, sentences.length]
  );

  const guidedStepBlanks = useMemo(
    () =>
      guidedStepIndices.map(idx => ({
        idx,
        correct: sentences[idx],
        userInput: guidedInputs[`guided-${idx}`] || '',
        graded: guidedGraded,
        correctFlag: grade(guidedInputs[`guided-${idx}`] || '', sentences[idx]),
      })),
    [guidedStepIndices, sentences, guidedInputs, guidedGraded, grade]
  );

  const importGuidedConfig = useCallback((raw: unknown) => {
    const config = sanitizeGuideConfig(raw);
    if (!config) return false;
    setGuidedConfig(config);
    setGuidedStep(0);
    setGuidedGraded(false);
    setGuidedChecked(false);
    setGuidedInputs({});
    return true;
  }, []);

  const clearGuidedConfig = useCallback(() => {
    setGuidedConfig(null);
    setGuidedStep(0);
    setGuidedGraded(false);
    setGuidedChecked(false);
    setGuidedInputs({});
    clearGuidedProgress(article.id);
  }, [article.id]);

  const goToStep = useCallback(
    (stepNum: number) => {
      if (stepNum >= 0 && stepNum < (guidedConfig?.steps.length || 0)) {
        setGuidedStep(stepNum);
        setGuidedGraded(false);
        setGuidedChecked(false);
      }
    },
    [guidedConfig]
  );

  const handleGuidedSubmit = useCallback(() => {
    setGuidedGraded(true);
    const answered = guidedStepBlanks.filter(b => b.userInput.trim()).length;
    const correct = guidedStepBlanks.filter(b => b.userInput.trim() && b.correctFlag).length;
    return { answered, correct };
  }, [guidedStepBlanks]);

  const setGuidedInput = useCallback((sentenceIdx: number, value: string) => {
    setGuidedInputs(prev => ({ ...prev, [`guided-${sentenceIdx}`]: value }));
  }, []);

  const resetGuidedProgress = useCallback(() => {
    setGuidedStep(0);
    setGuidedInputs({});
    setGuidedGraded(false);
    setGuidedChecked(false);
    clearGuidedProgress(article.id);
  }, [article.id]);

  return {
    // 模式
    mode,
    setMode,

    // 句子
    sentences,
    delimiters,

    // 全篇
    startFull,
    submitFull,
    userInputs,
    setUserInputs,
    graded,
    blanks,

    // 部分
    ratio,
    setRatio,
    blankCount,
    startRandom,
    startCustom,
    customSelected,
    handleSentenceClick,
    blankIndices,
    submitPartial,
    retryPartial,
    allCorrect,
    correctCount,

    // 指导
    guidedConfig,
    guidedEffectiveStep,
    guidedCurrentStep,
    guidedStepIndices,
    guidedStepBlanks,
    guidedInputs,
    setGuidedInput,
    guidedGraded,
    setGuidedGraded,
    guidedChecked,
    setGuidedChecked,
    importGuidedConfig,
    clearGuidedConfig,
    goToStep,
    handleGuidedSubmit,
    resetGuidedProgress,

    grade,
  };
}

export type ArticleMemoryState = ReturnType<typeof useArticleMemory>;
