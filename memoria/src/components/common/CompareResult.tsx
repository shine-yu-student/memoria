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
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 记忆结果</h2>

      <div style={styles.scoreBoard}>
        <span style={styles.scoreLabel}>得分</span>
        <span style={{ ...styles.scoreValue, color: score >= 80 ? '#16a34a' : score >= 50 ? '#ea580c' : '#dc2626' }}>
          {score}
        </span>
        <span style={styles.scoreDetail}>
          （{correctCount}/{total} 正确）
        </span>
      </div>

      <div style={styles.list}>
        {blanks.map((blank, idx) => (
          <div key={blank.id} style={styles.item}>
            <div style={styles.itemHeader}>
              <span style={styles.itemLabel}>#{idx + 1}</span>
              <span style={{ ...styles.itemBadge, backgroundColor: blank.correctFlag ? '#dcfce7' : '#fecaca', color: blank.correctFlag ? '#16a34a' : '#dc2626' }}>
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
    color: '#1e293b',
  },
  scoreBoard: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 700,
  },
  scoreDetail: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemLabel: {
    fontWeight: 600,
    color: '#475569',
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
    color: '#64748b',
    marginRight: 6,
  },
  fieldValue: {
    color: '#1e293b',
  },
  backBtn: {
    display: 'block',
    margin: '0 auto',
    padding: '12px 32px',
    fontSize: 16,
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};
