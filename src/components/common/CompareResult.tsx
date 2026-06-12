import React from 'react';
import type { BlankItem } from '../../types';
import { DiffView } from '../../utils/diff';

interface CompareResultProps {
  blanks: BlankItem[];
  onBack: () => void;
}

export const CompareResult: React.FC<CompareResultProps> = ({ blanks, onBack }) => {
  const correctCount = blanks.filter(b => b.correctFlag).length;
  const total = blanks.length;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        📊 记忆结果
        <span style={styles.summaryTag}>
          {correctCount}/{total} 正确
        </span>
      </h2>

      <div style={styles.list}>
        {blanks.map((blank, idx) => (
          <div key={blank.id} style={styles.item}>
            <div style={styles.itemHeader}>
              <span style={styles.itemLabel}>#{idx + 1}</span>
              <span style={{ ...styles.itemBadge, backgroundColor: blank.correctFlag ? 'var(--bg-success)' : 'var(--bg-danger)', color: blank.correctFlag ? 'var(--text-green-dark)' : 'var(--text-red)' }}>
                {blank.correctFlag ? '✅ 正确' : '❌ 有误'}
              </span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>原文：</span>
              <span style={styles.fieldValue}>{blank.correct}</span>
            </div>
            <div style={styles.field}>
              <span style={styles.fieldLabel}>你的输入：</span>
              <span style={styles.fieldValue}>
                <DiffView original={blank.correct} userInput={blank.userInput} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <button style={styles.backBtn} onClick={onBack}>
        🔙 返回
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 16px',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  summaryTag: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-description)',
    backgroundColor: 'var(--bg-hover)',
    padding: '4px 14px',
    borderRadius: 12,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  item: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 10,
    padding: 16,
    boxShadow: 'var(--shadow-card)',
    border: '1px solid var(--border-default)',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemLabel: {
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  itemBadge: {
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
  },
  field: {
    marginBottom: 8,
    lineHeight: 1.7,
  },
  fieldLabel: {
    fontWeight: 600,
    color: 'var(--text-description)',
    marginRight: 6,
  },
  fieldValue: {
    color: 'var(--text-primary)',
  },
  backBtn: {
    display: 'block',
    margin: '0 auto',
    padding: '12px 32px',
    fontSize: 16,
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-secondary)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};
