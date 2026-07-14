import React, { useState } from 'react';
import { Modal } from './Modal';
import { useLayoutSettings } from './LayoutContext';
import { useTheme } from './ThemeProvider';
import { JsonImportExport } from './JsonImportExport';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

type SettingsCategory = 'appearance' | 'data';

const categories: { key: SettingsCategory; label: string; icon: string }[] = [
  { key: 'appearance', label: '外观', icon: '🎨' },
  { key: 'data', label: '数据', icon: '📦' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, onDataChanged }) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const { sidebarPosition, setSidebarPosition, expandOnHoverExit, setExpandOnHoverExit, hidePreviousSentences, setHidePreviousSentences } = useLayoutSettings();
  const { theme, toggleTheme } = useTheme();

  const handleExportAll = () => {
    // The JsonImportExport component handles this internally
  };

  return (
    <Modal open={open} title="设置" onClose={onClose} wide>
      <div style={styles.container}>
        {/* Left sidebar */}
        <div style={styles.categoryList}>
          {categories.map(cat => (
            <button
              key={cat.key}
              style={{
                ...styles.categoryItem,
                ...(activeCategory === cat.key ? styles.categoryItemActive : {}),
              }}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={styles.content}>
          {activeCategory === 'appearance' && (
            <div>
              <h3 style={styles.sectionTitle}>外观</h3>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>侧栏位置</label>
                <div style={styles.optionGroup}>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(sidebarPosition === 'left' ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => setSidebarPosition('left')}
                  >
                    ⬅ 左侧
                  </button>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(sidebarPosition === 'right' ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => setSidebarPosition('right')}
                  >
                    右侧 ➡
                  </button>
                </div>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>颜色主题</label>
                <div style={styles.optionGroup}>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(theme === 'light' ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  >
                    ☀️ 浅色
                  </button>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(theme === 'dark' ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  >
                    🌙 深色
                  </button>
                </div>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>退出展开方式</label>
                <div style={styles.optionGroup}>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(expandOnHoverExit === 'mouseleave' ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => setExpandOnHoverExit('mouseleave')}
                  >
                    移出鼠标
                  </button>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(expandOnHoverExit === 'click-outside' ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => setExpandOnHoverExit('click-outside')}
                  >
                    点击外部
                  </button>
                </div>
              </div>
              <div style={styles.settingRow}>
                <label style={styles.settingLabel}>指导记忆</label>
                <div style={styles.optionGroup}>
                  <button
                    style={{
                      ...styles.optionBtn,
                      ...(hidePreviousSentences ? styles.optionBtnActive : {}),
                    }}
                    onClick={() => setHidePreviousSentences(!hidePreviousSentences)}
                  >
                    {hidePreviousSentences ? '隐藏之前的句子' : '显示之前的句子'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'data' && (
            <div>
              <h3 style={styles.sectionTitle}>数据</h3>
              <p style={styles.descText}>
                在此导入或导出全部数据。导入时按标题合并，同名词书的条目会进行去重。
              </p>
              <JsonImportExport onImport={onDataChanged} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 24,
    minHeight: 320,
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 120,
    borderRight: '1px solid var(--border-default)',
    paddingRight: 16,
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 15,
    textAlign: 'left',
    transition: 'background-color 0.15s',
  },
  categoryItemActive: {
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 20px 0',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-default)',
    gap: 16,
  },
  settingLabel: {
    fontSize: 15,
    color: 'var(--text-primary)',
    fontWeight: 500,
    minWidth: 120,
  },
  optionGroup: {
    display: 'flex',
    gap: 8,
  },
  optionBtn: {
    padding: '8px 18px',
    fontSize: 14,
    border: '1px solid var(--border-strong)',
    borderRadius: 6,
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  optionBtnActive: {
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-on-primary)',
    borderColor: 'var(--bg-primary)',
  },
  descText: {
    color: 'var(--text-description)',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 1.6,
  },
};
