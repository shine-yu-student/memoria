import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Article, BlankItem, GuideConfig } from '../../types';
import { uid } from '../../types';
import { pickRandomIndices, extractDelimiters } from '../../utils/splitter';
import { CompareResult } from '../common/CompareResult';
import { useLayoutSettings } from '../common/LayoutContext';

interface Props {
  article: Article;
  onBack: () => void;
}

export const ArticleMemoryView: React.FC<Props> = ({ article, onBack }) => {
  const { hidePreviousSentences } = useLayoutSettings();
  const [mode, setMode] = useState<'menu' | 'full' | 'partial-menu' | 'partial-random' | 'partial-custom' | 'guided-menu' | 'guided' | 'result'>('menu');
  const [blanks, setBlanks] = useState<BlankItem[]>([]);
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [customSelected, setCustomSelected] = useState<Set<number>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [userInputs, setUserInputs] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(`memoria:guided:${article.id}:inputs`) || '{}'); }
    catch { return {}; }
  });
  const [graded, setGraded] = useState(false);
  const [ratio, setRatio] = useState(0.4);
  const [guidedConfig, setGuidedConfig] = useState<GuideConfig | null>(() => {
    try {
      const raw = localStorage.getItem(`memoria:guided:${article.id}:config`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [guidedStep, setGuidedStep] = useState(() => {
    try {
      const raw = localStorage.getItem(`memoria:guided:${article.id}:step`);
      return raw ? parseInt(raw, 10) : 0;
    } catch { return 0; }
  });
  const [guidedGraded, setGuidedGraded] = useState(false);
  const [guidedChecked, setGuidedChecked] = useState(false);

  const sentences = article.sentences;
  // 原始分隔符
  const delimiters = useMemo(() => extractDelimiters(article.content, sentences), [article.content, sentences]);

  // Persist guided config/progress to localStorage
  const guidedStorageKey = `memoria:guided:${article.id}`;
  useEffect(() => {
    if (guidedConfig) {
      localStorage.setItem(`${guidedStorageKey}:config`, JSON.stringify(guidedConfig));
      localStorage.setItem(`${guidedStorageKey}:step`, String(guidedStep));
    } else {
      localStorage.removeItem(`${guidedStorageKey}:config`);
      localStorage.removeItem(`${guidedStorageKey}:step`);
    }
  }, [guidedConfig, guidedStep, guidedStorageKey]);
  useEffect(() => {
    localStorage.setItem(`${guidedStorageKey}:inputs`, JSON.stringify(userInputs));
  }, [userInputs, guidedStorageKey]);

  /** 全篇记忆 */
  const startFull = () => {
    setMode('full');
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
  };

  /** 随机记忆 */
  const startRandom = () => {
    const count = Math.max(1, Math.ceil(sentences.length * Math.min(1, Math.max(0.01, ratio))));
    const indices = pickRandomIndices(sentences.length, count);
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
  };

  /** 指定记忆 — 确认选择 */
  const startCustom = () => {
    if (customSelected.size === 0) {
      alert('请至少选择一个句子');
      return;
    }
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
  };

  /** 提交答案（partial 模式用） */
  const handleSubmit = () => {
    const updated = blanks.map(b => ({
      ...b,
      userInput: userInputs[b.id] || '',
      graded: true,
      correctFlag: (userInputs[b.id] || '').trim() === b.correct.trim(),
    }));
    setBlanks(updated);
    setGraded(true);
  };

  /** 提交全篇记忆并查看结果 */
  const handleSubmitFull = () => {
    const updated = blanks.map(b => ({
      ...b,
      userInput: userInputs[b.id] || '',
      graded: true,
      correctFlag: (userInputs[b.id] || '').trim() === b.correct.trim(),
    }));
    setBlanks(updated);
    setMode('result');
  };

  /** 全部空白是否都正确 */
  const allCorrect = graded && blanks.every(b => b.correctFlag);

  /** 返回菜单 */
  const backToMenu = () => {
    setMode('menu');
    setGraded(false);
  };

  /** 处理句子选择（支持 Shift+点击范围选择） */
  const handleSentenceClick = useCallback((idx: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedIndex !== null && lastClickedIndex !== idx) {
      // Select range between lastClickedIndex and idx
      const start = Math.min(lastClickedIndex, idx);
      const end = Math.max(lastClickedIndex, idx);
      const next = new Set(customSelected);
      for (let i = start; i <= end; i++) {
        next.add(i);
      }
      setCustomSelected(next);
      setLastClickedIndex(idx);
    } else {
      const next = new Set(customSelected);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      setCustomSelected(next);
      setLastClickedIndex(idx);
    }
  }, [customSelected, lastClickedIndex]);

  /** 显示模式选择菜单 */
  if (mode === 'menu') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.modeOption}>
            <span style={styles.modeIcon}>📝</span>
            <div style={styles.modeContent}>
              <h3 style={styles.modeTitle}>全篇记忆</h3>
              <p style={styles.modeDesc}>不提供任何提示，凭记忆输入整篇文章。</p>
            </div>
            <button style={styles.modeBtn} onClick={startFull}>选择</button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.modeOption}>
            <span style={styles.modeIcon}>📄</span>
            <div style={styles.modeContent}>
              <h3 style={styles.modeTitle}>部分记忆</h3>
              <p style={styles.modeDesc}>只记忆文章中部分句子。</p>
            </div>
            <button style={styles.modeBtn} onClick={() => setMode('partial-menu')}>选择</button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.modeOption}>
            <span style={styles.modeIcon}>🎯</span>
            <div style={styles.modeContent}>
              <h3 style={styles.modeTitle}>指导记忆</h3>
              <p style={styles.modeDesc}>按照配置步骤逐步记忆文章，适合初次接触的文言文。</p>
            </div>
            <button style={styles.modeBtn} onClick={() => setMode('guided-menu')}>选择</button>
          </div>
        </div>

        <button style={{ ...styles.backBtn, display: 'block', margin: '20px auto 0' }} onClick={onBack}>🔙 返回文章列表</button>
      </div>
    );
  }

  /** 部分记忆 — 选择随机/指定 */
  if (mode === 'partial-menu') {
    return (
      <div style={{ ...styles.container, overflow: 'hidden' }}>
        {/* Random memory section */}
        <div style={styles.partialSection}>
          <div style={styles.randomRow}>
            <button style={styles.optionBtn} onClick={startRandom}>
              🎲 随机记忆
            </button>
            <div style={styles.ratioRow}>
              <label style={styles.ratioLabel}>选取比例：</label>
              <input
                type="number"
                style={styles.ratioInput}
                min={0.01}
                max={1}
                step={0.05}
                value={ratio}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v)) setRatio(Math.min(1, Math.max(0.01, v)));
                }}
              />
              <span style={styles.ratioHint}>
                （共 {sentences.length} 句，约 {Math.max(1, Math.ceil(sentences.length * ratio))} 句）
              </span>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={styles.separator} />

        {/* Custom selection section — fill remaining space */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={styles.customHeader}>
            <span style={styles.customIcon}>✋</span>
            <span style={styles.customTitle}>指定记忆</span>
          </div>

          {/* Article sentences as buttons */}
          <div style={styles.sentenceContainer}>
            {sentences.length === 0 && (
              <p style={styles.emptySentences}>本文没有可选的句子。</p>
            )}
            {sentences.map((s, idx) => {
              const isSelected = customSelected.has(idx);
              const delim = delimiters[idx] || '';
              return (
                <React.Fragment key={idx}>
                  {delim && <span style={styles.delimiterText}>{delim}</span>}
                  <button
                    style={{
                      ...styles.sentenceBtn,
                      ...(isSelected ? styles.sentenceBtnSelected : {}),
                    }}
                    onClick={(e) => handleSentenceClick(idx, e)}
                  >
                    {isSelected ? '✓ ' : ''}{s}
                  </button>
                </React.Fragment>
              );
            })}
            {delimiters[sentences.length] && (
              <span style={styles.delimiterText}>{delimiters[sentences.length]}</span>
            )}
          </div>

          <button
            style={{
              ...styles.primaryBtn,
              marginTop: 12,
              flexShrink: 0,
              opacity: customSelected.size === 0 ? 0.5 : 1,
            }}
            onClick={startCustom}
            disabled={customSelected.size === 0}
          >
            开始记忆选中的 {customSelected.size} 句
          </button>
        </div>

        <button style={{ ...styles.backBtn, display: 'block', margin: '12px auto 0', flexShrink: 0 }} onClick={() => setMode('menu')}>🔙 返回</button>
      </div>
    );
  }

  /** 指导记忆 — 配置导入页面 */
  if (mode === 'guided-menu') {
    return (
      <div style={{ ...styles.container, maxWidth: '100%' }}>
        <h2 style={styles.sectionTitle}>🎯 指导记忆</h2>

        {/* AI prompt for generating config */}
        <div style={styles.card}>
          <h3 style={styles.guidedSectionTitle}>🤖 使用 AI 生成配置</h3>
          <p style={{ color: 'var(--text-description)', fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>
            将以下提示词提供给外部大模型（如 ChatGPT、Claude 等），它将会生成指导记忆配置文件。
          </p>
          <textarea
            style={styles.guidedPromptTextarea}
            rows={10}
            readOnly
            value={`请为以下文章生成一个"指导记忆"的JSON配置文件。该文件用于帮助用户逐步记忆文章，适合初次接触文言文的学习者。

文章标题：${article.title}
文章内容：
${article.content}

句子列表（已按标点切分）：
${sentences.map((s, i) => `  ${i}: ${s}`).join('\n')}

请按以下JSON格式输出，每个step包含一条提示文本(hint)和该步骤要记忆的句子索引(sentenceIndices)。步骤应由易到难，逐步增加句子数量。

{"steps": [{"hint": "提示文本", "sentenceIndices": [0, 1]}]}`}
            onClick={(e) => {
              (e.target as HTMLTextAreaElement).select();
              navigator.clipboard?.writeText((e.target as HTMLTextAreaElement).value);
            }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>点击文本框自动复制到剪贴板</p>
        </div>

        {/* Config import */}
        <div style={styles.card}>
          <h3 style={styles.guidedSectionTitle}>📂 导入配置文件</h3>
          <p style={{ color: 'var(--text-description)', fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>
            导入指导记忆 JSON 配置文件。
            格式：<code>{`{ "steps": [{ "hint": "提示文本", "sentenceIndices": [0, 1] }] }`}</code>
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={styles.fileUploadLabel}>
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const config = JSON.parse(reader.result as string) as GuideConfig;
                      if (!config.steps || !Array.isArray(config.steps)) {
                        alert('无效的配置格式：缺少 steps 数组');
                        return;
                      }
                      setGuidedConfig(config);
                      setGuidedStep(0);
                      setGuidedGraded(false);
                      setGuidedChecked(false);
                      setUserInputs({});
                    } catch {
                      alert('JSON 解析失败');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <span style={styles.fileUploadBtn}>📂 选择 JSON 配置文件</span>
            </label>
            {guidedConfig && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button style={styles.primaryBtn} onClick={() => setMode('guided')}>
                  开始记忆（共 {guidedConfig.steps.length} 步）
                </button>
                <button style={{
                  ...styles.primaryBtn,
                  color: 'var(--text-red)',
                  borderColor: 'var(--border-red)',
                }} onClick={() => {
                  if (confirm('确定清除当前记忆进度？这将重置到第一步并清空所有输入。')) {
                    setGuidedStep(0);
                    setUserInputs({});
                    setGuidedGraded(false);
                    setGuidedChecked(false);
                  }
                }}>
                  🗑️ 清除进度
                </button>
              </div>
            )}
          </div>
          {guidedConfig && (
            <p style={{ fontSize: 13, color: 'var(--text-green)', marginTop: 8 }}>
              ✅ 已加载配置文件，共 {guidedConfig.steps.length} 个步骤
            </p>
          )}
        </div>

        <button style={{ ...styles.backBtn, display: 'block', margin: '20px auto 0' }} onClick={() => setMode('menu')}>🔙 返回</button>
      </div>
    );
  }

  /** 指导记忆 — 步骤答题界面 */
  if (mode === 'guided') {
    const config = guidedConfig;
    const step = config?.steps[guidedStep];
    const stepIndices = step?.sentenceIndices || [];
    const firstTargetIdx = stepIndices.length > 0 ? Math.min(...stepIndices) : -1;
    const lastTargetIdx = stepIndices.length > 0 ? Math.max(...stepIndices) : -1;

    // Compute covered vs not-yet-covered sentence indices
    const coveredIndices = new Set<number>();
    const currentStepIndices = new Set(stepIndices);
    const previousStepIndices = new Set<number>();
    if (config) {
      for (let s = 0; s < config.steps.length; s++) {
        for (const idx of config.steps[s].sentenceIndices) {
          coveredIndices.add(idx);
          if (s < guidedStep) previousStepIndices.add(idx);
        }
      }
    }
    const stepBlanks = stepIndices.map(idx => ({
      id: uid(),
      correct: sentences[idx],
      userInput: userInputs[`guided-${idx}`] || '',
      graded: guidedGraded,
      correctFlag: (userInputs[`guided-${idx}`] || '').trim() === sentences[idx].trim(),
    }));

    /** 渲染分隔符（同部分记忆） */
    const renderDelimiter = (delim: string, key: string | number) => {
      if (!delim) return null;
      const parts = delim.split(/(\n)/);
      return (
        <span key={key} style={styles.articlePunct}>
          {parts.map((part, i) => (part === '\n' ? <br key={i} /> : part))}
        </span>
      );
    };

    const handleGuidedCheck = () => {
      setGuidedChecked(true);
    };

    const handleGuidedSubmit = () => {
      setGuidedGraded(true);
      // Grade only answered blanks
      const correctCount = stepBlanks.filter(b => b.userInput.trim() && b.correctFlag).length;
      const answeredCount = stepBlanks.filter(b => b.userInput.trim()).length;
      alert(`已批改 ${answeredCount} 空，正确 ${correctCount} 空。`);
    };

    const goToStep = (stepNum: number) => {
      if (stepNum >= 0 && stepNum < (config?.steps.length || 0)) {
        setGuidedStep(stepNum);
        setGuidedGraded(false);
        setGuidedChecked(false);
      }
    };

    const handleStepInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = parseInt(e.target.value, 10);
      if (!isNaN(num) && num >= 1 && num <= (config?.steps.length || 0)) {
        goToStep(num - 1);
      }
    };

    return (
      <div style={{ ...styles.container, overflow: 'hidden' }}>
        {/* Hint box — shrink to content */}
        <div style={styles.guidedHintBox}>
          <p style={styles.guidedHintText}>{step?.hint || ''}</p>
        </div>

        {/* Separator */}
        <div style={styles.separator} />

        {/* Article content with blanks — fill remaining space */}
        <div style={{ ...styles.articleScrollContainer, flex: 1, minHeight: 0, maxHeight: 'none' }}>
          {!guidedChecked ? (
            /* Before check: show target sentences highlighted */
            <div style={styles.articleContent}>
              {sentences.map((s, idx) => {
                const delim = delimiters[idx] || '';

                // Sentences after last target: always hide
                if (lastTargetIdx >= 0 && idx > lastTargetIdx) {
                  return (
                    <span key={idx}>
                      {renderDelimiter(delim, `d-${idx}`)}
                      <span style={{ ...styles.articleBlankDisplay, borderBottom: '2px solid var(--text-muted)', color: 'transparent', opacity: 0.3 }}>_</span>
                    </span>
                  );
                }
                // Sentences before first target: hide based on setting (show disabled blank, keep punctuation)
                if (firstTargetIdx >= 0 && idx < firstTargetIdx && hidePreviousSentences) {
                  return (
                    <span key={idx}>
                      {renderDelimiter(delim, `d-${idx}`)}
                      <span style={{ ...styles.articleBlankDisplay, borderBottom: '2px solid var(--text-muted)', color: 'transparent', opacity: 0.3 }}>_</span>
                    </span>
                  );
                }
                return (
                  <span key={idx}>
                    {renderDelimiter(delim, `d-${idx}`)}
                    <span style={{
                      ...styles.articleText,
                      ...(currentStepIndices.has(idx) ? styles.guidedTargetText : {}),
                    }}>
                      {s}
                    </span>
                  </span>
                );
              })}
              {renderDelimiter(delimiters[sentences.length] || '', 'd-last')}
            </div>
          ) : (
            /* After check: show blanks for target sentences */
            <div style={styles.articleContent}>
              {sentences.map((s, idx) => {
                const isTarget = currentStepIndices.has(idx);
                const delim = delimiters[idx] || '';
                const blankItem = stepBlanks.find(b => b.correct === sentences[idx]);

                // Sentences after last target: always show as empty disabled blank
                if (lastTargetIdx >= 0 && idx > lastTargetIdx) {
                  return (
                    <span key={idx}>
                      {renderDelimiter(delim, `d-${idx}`)}
                      <span style={{ ...styles.articleBlankDisplay, borderBottom: '2px solid var(--text-muted)', color: 'transparent' }}>_</span>
                    </span>
                  );
                }
                // Sentences before first target: hide based on setting (show disabled blank, keep punctuation)
                if (firstTargetIdx >= 0 && idx < firstTargetIdx && hidePreviousSentences) {
                  return (
                    <span key={idx}>
                      {renderDelimiter(delim, `d-${idx}`)}
                      <span style={{ ...styles.articleBlankDisplay, borderBottom: '2px solid var(--text-muted)', color: 'transparent' }}>_</span>
                    </span>
                  );
                }
                // Current step: interactive blanks for targets, normal text for non-targets in range
                return (
                  <span key={idx}>
                    {renderDelimiter(delim, `d-${idx}`)}
                    {isTarget && blankItem ? (
                      <span style={styles.blankWrapper}>
                        {guidedGraded && blankItem.userInput.trim() ? (
                          <span style={{
                            ...styles.articleBlankDisplay,
                            ...(blankItem.correctFlag ? styles.blankCorrect : styles.blankWrong),
                          }}
                          title={blankItem.correctFlag ? '' : `正确答案：${blankItem.correct}`}>
                            {blankItem.userInput}
                          </span>
                        ) : (
                          <textarea
                            style={styles.articleBlankInput}
                            rows={1}
                            value={userInputs[`guided-${idx}`] || ''}
                            onChange={e => setUserInputs({ ...userInputs, [`guided-${idx}`]: e.target.value })}
                          />
                        )}
                      </span>
                    ) : (
                      <span style={styles.articleText}>{s}</span>
                    )}
                  </span>
                );
              })}
              {renderDelimiter(delimiters[sentences.length] || '', 'd-last')}
            </div>
          )}
        </div>

        {/* Bottom bar: back | step-nav | check/submit — stays at bottom */}
        <div style={{ ...styles.guidedBottomBar, flexShrink: 0 }}>
          <button style={styles.backBtn} onClick={() => setMode('guided-menu')}>🔙 返回</button>

          <div style={styles.guidedStepNav}>
            <button
              style={styles.guidedStepBtn}
              onClick={() => goToStep(guidedStep - 1)}
              disabled={guidedStep === 0}
            >
              ◀
            </button>
            <span style={styles.guidedStepDisplay}>
              <input
                style={styles.guidedStepInput}
                type="number"
                min={1}
                max={config?.steps.length || 1}
                value={guidedStep + 1}
                onChange={handleStepInput}
              />
              {' / '}{config?.steps.length || 0}
            </span>
            <button
              style={styles.guidedStepBtn}
              onClick={() => goToStep(guidedStep + 1)}
              disabled={!config || guidedStep >= config.steps.length - 1}
            >
              ▶
            </button>
          </div>

          {!guidedChecked ? (
            <button style={styles.guidedCheckBtn} onClick={handleGuidedCheck}>
              🔍 检查
            </button>
          ) : (
            <button style={styles.submitBtn} onClick={handleGuidedSubmit}>
              📤 提交检查
            </button>
          )}
        </div>
      </div>
    );
  }

  /** 全篇记忆答题界面 */
  if (mode === 'full') {
    return (
      <div style={{ ...styles.container, overflow: 'hidden' }}>
        <h2 style={styles.sectionTitle}>📝 全篇记忆{' — '}{article.title}</h2>

        <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <p style={{ color: 'var(--text-description)', marginBottom: 10 }}>请凭记忆输入整篇文章：</p>
          <textarea
            style={{ ...styles.textarea, flex: 1, minHeight: 60 }}
            value={userInputs[blanks[0]?.id] || ''}
            onChange={e => setUserInputs({ ...userInputs, [blanks[0].id]: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, flexShrink: 0 }}>
          <button style={styles.backBtn} onClick={backToMenu}>🔙 返回</button>
          <button style={styles.submitBtn} onClick={handleSubmitFull}>📤 提交检查</button>
        </div>
      </div>
    );
  }

  /** 部分记忆答题界面（随机 / 指定 共用） */
  if (mode === 'partial-random' || mode === 'partial-custom') {
    const isRandom = mode === 'partial-random';

    /** 将分隔符中的换行渲染为 <br /> */
    const renderDelimiter = (delim: string, key: string | number) => {
      if (!delim) return null;
      const parts = delim.split(/(\n)/);
      return (
        <span key={key} style={styles.articlePunct}>
          {parts.map((part, i) =>
            part === '\n' ? <br key={i} /> : part
          )}
        </span>
      );
    };

    return (
      <div style={{ ...styles.container, overflow: 'hidden' }}>
        <h2 style={styles.sectionTitle}>
          {isRandom ? '🎲 随机记忆' : '✋ 指定记忆'}
          {' — '}{article.title}
        </h2>

        {allCorrect && (
          <div style={styles.allCorrectBanner}>
            🎉 全部正确！太棒了！
          </div>
        )}

        <div style={{ ...styles.articleScrollContainer, flex: 1, minHeight: 0, maxHeight: 'none' }}>
          {graded && (
            <div style={styles.resultSummary}>
              {blanks.filter(b => b.correctFlag).length}/{blanks.length} 正确
            </div>
          )}
          <div style={styles.articleContent}>
            {sentences.map((s, idx) => {
              const blankIdx = blankIndices.indexOf(idx);
              const isBlank = blankIdx !== -1;
              const blankItem = isBlank ? blanks[blankIdx] : undefined;
              const isGradedBlank = graded && isBlank && blankItem;

              // 该句子前的分隔符（delimiters[idx]）
              const delim = delimiters[idx] || '';

              return (
                <span key={idx} style={styles.articleSegment}>
                  {/* 句子前的分隔符 */}
                  {renderDelimiter(delim, `d-${idx}`)}

                  {isBlank && blankItem ? (
                    <span style={styles.blankWrapper}>
                      {graded ? (
                        <span
                          style={{
                            ...styles.articleBlankDisplay,
                            ...(blankItem.correctFlag
                              ? styles.blankCorrect
                              : styles.blankWrong),
                          }}
                          title={blankItem.correctFlag ? '' : `正确答案：${blankItem.correct}`}
                        >
                          {userInputs[blankItem.id] || ''}
                        </span>
                      ) : (
                        <textarea
                          style={styles.articleBlankInput}
                          rows={1}
                          value={userInputs[blankItem.id] || ''}
                          onChange={e => setUserInputs({ ...userInputs, [blankItem.id]: e.target.value })}
                        />
                      )}
                    </span>
                  ) : (
                    <span style={styles.articleText}>
                      {s}
                    </span>
                  )}
                </span>
              );
            })}
            {/* 末尾分隔符 */}
            {renderDelimiter(delimiters[sentences.length] || '', 'd-last')}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button style={styles.backBtn} onClick={backToMenu}>🔙 返回</button>
          {!graded ? (
            <button style={styles.submitBtn} onClick={handleSubmit}>📤 提交检查</button>
          ) : (
            <button style={styles.retryBtn} onClick={() => {
              // 重置为未批改状态，清空输入
              const reset = blanks.map(b => ({ ...b, userInput: '', graded: false, correctFlag: false }));
              setBlanks(reset);
              setUserInputs(Object.fromEntries(reset.map(i => [i.id, ''])));
              setGraded(false);
            }}>
              🔄 重新作答
            </button>
          )}
        </div>
      </div>
    );
  }

  /** 全篇记忆结果（CompareResult 不带分数） */
  if (mode === 'result') {
    return <CompareResult blanks={blanks} onBack={backToMenu} />;
  }

  return null;
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 28px', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' },
  sectionTitle: { textAlign: 'center', color: 'var(--text-primary)', marginBottom: 16, fontSize: 20 },
  card: {
    backgroundColor: 'var(--bg-page)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    border: '1px solid var(--border-default)',
  },
  modeOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  modeIcon: {
    fontSize: 28,
    flexShrink: 0,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 4px 0',
  },
  modeDesc: {
    color: 'var(--text-description)',
    fontSize: 14,
    margin: 0,
    lineHeight: 1.5,
  },
  modeBtn: {
    padding: '8px 18px',
    fontSize: 14,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    cursor: 'pointer',
    flexShrink: 0,
  },
  optionBtn: {
    padding: '10px 24px',
    fontSize: 16,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  primaryBtn: {
    padding: '10px 20px',
    fontSize: 15,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '10px 24px',
    fontSize: 15,
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    fontSize: 15,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.8,
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    minHeight: 200,
  },
  /* Partial memory selection */
  partialSection: {
    marginBottom: 16,
  },
  randomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  ratioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratioLabel: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  ratioInput: {
    width: 80,
    padding: '6px 10px',
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    fontSize: 15,
    textAlign: 'center',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
  },
  ratioHint: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  separator: {
    height: 1,
    backgroundColor: 'var(--border-default)',
    margin: '16px 0',
  },
  customSection: {},
  customHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customIcon: {
    fontSize: 20,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  sentenceContainer: {
    backgroundColor: 'var(--bg-page)',
    borderRadius: 12,
    padding: 16,
    border: '1px solid var(--border-default)',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 2,
    maxHeight: 'none',
    overflowY: 'auto',
    lineHeight: 1.8,
    flex: 1,
    minHeight: 0,
  },
  sentenceBtn: {
    display: 'inline-block',
    padding: '4px 8px',
    fontSize: 14,
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    lineHeight: 1.6,
    textAlign: 'left',
    margin: 1,
  },
  delimiterText: {
    fontSize: 14,
    color: 'var(--text-muted)',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap' as const,
  },
  sentenceBtnSelected: {
    backgroundColor: 'var(--bg-success)',
    borderColor: 'var(--border-green-light)',
    color: 'var(--text-green-dark)',
  },
  emptySentences: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: 20,
    width: '100%',
  },
  /* 文章区域（部分记忆） */
  articleScrollContainer: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 12,
    padding: '20px 24px',
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-card)',
    maxHeight: 'calc(100vh - 280px)',
    overflowY: 'auto',
    lineHeight: 2,
  },
  articleContent: {
    display: 'inline',
  },
  articleSegment: {
    display: 'inline',
  },
  articleText: {
    fontSize: 16,
    color: 'var(--text-primary)',
    lineHeight: 2,
  },
  articlePunct: {
    fontSize: 16,
    color: 'var(--text-muted)',
    marginRight: 2,
  },
  blankWrapper: {
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  articleBlankInput: {
    display: 'inline-block',
    minWidth: 160,
    minHeight: 32,
    padding: '4px 0',
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    fontSize: 15,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    backgroundColor: 'transparent',
    verticalAlign: 'middle',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden',
  },
  articleBlankDisplay: {
    display: 'inline-block',
    minWidth: 160,
    minHeight: 32,
    padding: '4px 0',
    borderBottom: '2px solid var(--border-strong)',
    fontSize: 15,
    lineHeight: 1.6,
    verticalAlign: 'middle',
  },
  blankCorrect: {
    borderBottom: '2px solid var(--text-green-dark)',
    color: 'var(--text-green-dark)',
  },
  blankWrong: {
    borderBottom: '2px solid var(--text-red)',
    color: 'var(--text-red)',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 24px',
    fontSize: 15,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  retryBtn: {
    padding: '10px 24px',
    fontSize: 15,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  /* 全对横幅 */
  allCorrectBanner: {
    textAlign: 'center',
    padding: '12px 20px',
    backgroundColor: 'var(--bg-success)',
    color: 'var(--text-green-dark)',
    fontWeight: 700,
    fontSize: 18,
    borderRadius: 10,
    marginBottom: 16,
    border: '2px solid var(--border-green-light)',
  },
  /* 结果概要 */
  resultSummary: {
    textAlign: 'center',
    fontSize: 14,
    color: 'var(--text-description)',
    marginBottom: 12,
    padding: '6px 12px',
    backgroundColor: 'var(--bg-page)',
    borderRadius: 8,
    display: 'inline-block',
  },
  /* 指导记忆 */
  guidedSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 10px 0',
  },
  guidedPromptTextarea: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 1.6,
    resize: 'vertical',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  guidedHintBox: {
    backgroundColor: 'var(--bg-page)',
    borderRadius: 12,
    padding: '14px 18px',
    border: '1px solid var(--border-default)',
    marginBottom: 12,
  },
  guidedHintText: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    margin: 0,
  },
  guidedTargetText: {
    backgroundColor: 'var(--bg-success)',
    padding: '2px 4px',
    borderRadius: 4,
  },
  guidedBottomBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  guidedStepNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  guidedStepBtn: {
    padding: '6px 12px',
    fontSize: 14,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 6,
    cursor: 'pointer',
  },
  guidedStepDisplay: {
    fontSize: 14,
    color: 'var(--text-primary)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  guidedStepInput: {
    width: 40,
    padding: '4px 6px',
    fontSize: 14,
    textAlign: 'center' as const,
    border: 'none',
    borderBottom: '2px solid var(--border-strong)',
    borderRadius: 0,
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  guidedCheckBtn: {
    padding: '10px 24px',
    fontSize: 15,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  fileUploadLabel: {
    cursor: 'pointer' as const,
  },
  fileUploadBtn: {
    display: 'inline-block',
    padding: '10px 24px',
    fontSize: 15,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    cursor: 'pointer',
  },
};
