import React, { useState, useMemo } from 'react';
import type { Article, BlankItem } from '../../types';
import { uid } from '../../types';
import { pickRandomIndices } from '../../utils/splitter';
import { CompareResult } from '../common/CompareResult';

interface Props {
  article: Article;
  onBack: () => void;
}

export const ArticleMemoryView: React.FC<Props> = ({ article, onBack }) => {
  const [mode, setMode] = useState<'menu' | 'full' | 'partial-menu' | 'partial-random' | 'partial-custom' | 'result'>('menu');
  const [blanks, setBlanks] = useState<BlankItem[]>([]);
  const [blankIndices, setBlankIndices] = useState<number[]>([]);
  const [customSelected, setCustomSelected] = useState<Set<number>>(new Set());
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  const sentences = article.sentences;

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
  };

  /** 随机记忆 */
  const startRandom = () => {
    const count = Math.max(1, Math.ceil(sentences.length * 0.4));
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
    setMode('partial-custom');
  };

  /** 提交答案 */
  const handleSubmit = () => {
    const updated = blanks.map(b => ({
      ...b,
      userInput: userInputs[b.id] || '',
      graded: true,
      correctFlag: (userInputs[b.id] || '').trim() === b.correct.trim(),
    }));
    setBlanks(updated);
    setMode('result');
  };

  /** 显示模式选择菜单 */
  if (mode === 'menu') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🧠 {article.title}</h2>
        <p style={styles.meta}>共 {sentences.length} 句 / {article.content.length} 字</p>

        <div style={styles.card}>
          <button style={styles.optionBtn} onClick={startFull}>
            📝 全篇记忆
          </button>
          <p style={styles.optionDesc}>不提供任何提示，凭记忆输入整篇文章。</p>
        </div>

        <div style={styles.card}>
          <button style={styles.optionBtn} onClick={() => setMode('partial-menu')}>
            📄 部分记忆
          </button>
          <p style={styles.optionDesc}>只记忆文章中部分句子。</p>
        </div>

        <button style={styles.backBtn} onClick={onBack}>🔙 返回文章列表</button>
      </div>
    );
  }

  /** 部分记忆 — 选择随机/指定 */
  if (mode === 'partial-menu') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>📄 部分记忆</h2>

        <div style={styles.card}>
          <button style={styles.optionBtn} onClick={startRandom}>
            🎲 随机记忆
          </button>
          <p style={styles.optionDesc}>系统随机选取约 40% 的句子供你填写。</p>
        </div>

        <div style={styles.card}>
          <h3 style={{ margin: '0 0 10px 0' }}>✋ 指定记忆</h3>
          <p style={styles.optionDesc}>点击选择你要记忆的句子：</p>
          <div style={styles.sentenceGrid}>
            {sentences.map((s, idx) => (
              <label
                key={idx}
                style={{
                  ...styles.sentenceLabel,
                  ...(customSelected.has(idx) ? styles.sentenceLabelSelected : {}),
                }}
              >
                <input
                  type="checkbox"
                  checked={customSelected.has(idx)}
                  onChange={() => {
                    const next = new Set(customSelected);
                    next.has(idx) ? next.delete(idx) : next.add(idx);
                    setCustomSelected(next);
                  }}
                  style={{ marginRight: 6 }}
                />
                <span>
                  <strong style={{ color: '#64748b' }}>#{idx + 1}</strong>{' '}
                  {s.length > 50 ? s.slice(0, 50) + '…' : s}
                </span>
              </label>
            ))}
          </div>
          <button
            style={{ ...styles.primaryBtn, marginTop: 12 }}
            onClick={startCustom}
          >
            开始记忆选中的 {customSelected.size} 句
          </button>
        </div>

        <button style={styles.backBtn} onClick={() => setMode('menu')}>🔙 返回</button>
      </div>
    );
  }

  /** 记忆答题界面（全篇 / 部分随机 / 部分指定共用） */
  if (mode === 'full' || mode === 'partial-random' || mode === 'partial-custom') {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>
          {mode === 'full' ? '📝 全篇记忆' : mode === 'partial-random' ? '🎲 随机记忆' : '✋ 指定记忆'}
          {' — '}{article.title}
        </h2>

        {mode === 'full' && (
          <div style={styles.card}>
            <p style={{ color: '#64748b', marginBottom: 10 }}>请凭记忆输入整篇文章：</p>
            <textarea
              style={styles.textarea}
              rows={12}
              placeholder="在此输入文章全文……"
              value={userInputs[blanks[0]?.id] || ''}
              onChange={e => setUserInputs({ ...userInputs, [blanks[0].id]: e.target.value })}
            />
          </div>
        )}

        {(mode === 'partial-random' || mode === 'partial-custom') && (
          <div style={styles.articleScrollContainer}>
            <p style={{ color: '#64748b', marginBottom: 12, fontSize: 14 }}>
              全文显示如下，被选中的句子已被替换为输入框。
            </p>
            <div style={styles.articleContent}>
              {sentences.map((s, idx) => {
                const blankIdx = blankIndices.indexOf(idx);
                const blankItem = blankIdx !== -1 ? blanks[blankIdx] : undefined;
                const isLast = idx === sentences.length - 1;
                return (
                  <span key={idx} style={styles.articleSegment}>
                    {blankItem ? (
                      <span style={styles.blankWrapper}>
                        <textarea
                          style={styles.articleBlankInput}
                          rows={1}
                          placeholder="在此输入……"
                          value={userInputs[blankItem.id] || ''}
                          onChange={e => setUserInputs({ ...userInputs, [blankItem.id]: e.target.value })}
                        />
                        {!isLast && <span style={styles.articlePunct}>，</span>}
                      </span>
                    ) : (
                      <span style={styles.articleText}>
                        {s}{!isLast && <span style={styles.articlePunct}>,</span>}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button style={styles.backBtn} onClick={() => setMode('menu')}>🔙 返回</button>
          <button style={styles.submitBtn} onClick={handleSubmit}>📤 提交检查</button>
        </div>
      </div>
    );
  }

  /** 结果界面 */
  if (mode === 'result') {
    return <CompareResult blanks={blanks} onBack={() => setMode('menu')} />;
  }

  return null;
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  title: { textAlign: 'center', color: '#1e293b', marginBottom: 8 },
  meta: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginBottom: 24 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  optionBtn: {
    padding: '10px 24px',
    fontSize: 16,
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 8,
  },
  optionDesc: { color: '#64748b', fontSize: 14, lineHeight: 1.6 },
  sentenceGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 400,
    overflowY: 'auto',
  },
  sentenceLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    lineHeight: 1.6,
    fontSize: 14,
  },
  sentenceLabelSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  primaryBtn: {
    padding: '10px 20px',
    fontSize: 15,
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '10px 24px',
    fontSize: 15,
    backgroundColor: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 15,
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.8,
    boxSizing: 'border-box',
  },
  /* 文章区域（部分记忆） */
  articleScrollContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '20px 24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
    color: '#1e293b',
    lineHeight: 2,
  },
  articlePunct: {
    fontSize: 16,
    color: '#94a3b8',
    marginRight: 2,
  },
  blankWrapper: {
    display: 'inline-block',
    verticalAlign: 'middle',
  },
  articleBlankInput: {
    display: 'inline-block',
    width: 180,
    padding: '4px 10px',
    border: '2px dashed #059669',
    borderRadius: 6,
    fontSize: 15,
    fontFamily: 'inherit',
    lineHeight: 1.6,
    backgroundColor: '#f0fdf4',
    verticalAlign: 'middle',
    outline: 'none',
  },
  submitBtn: {
    padding: '10px 32px',
    fontSize: 16,
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};
