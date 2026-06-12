import React from 'react';
import { useTheme } from './ThemeProvider';

export type TabType = 'chinese' | 'english' | 'import-export';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'chinese', label: '📖 语文记忆' },
  { key: 'english', label: '📝 英语记忆' },
  { key: 'import-export', label: '📦 导入/导出' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>Memoria</div>
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.activeTab : {}),
            }}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button style={styles.themeToggle} onClick={toggleTheme} title={theme === 'light' ? '切换深色模式' : '切换浅色模式'}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    height: 56,
    backgroundColor: 'var(--bg-nav)',
    color: 'var(--text-on-nav)',
    gap: 32,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  tab: {
    padding: '8px 18px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: 'var(--text-nav-tab)',
    cursor: 'pointer',
    fontSize: 15,
    transition: 'all 0.15s',
  },
  activeTab: {
    backgroundColor: 'var(--bg-tab-active)',
    color: 'var(--text-on-primary)',
    fontWeight: 600,
  },
  themeToggle: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'var(--bg-tab-active)',
    color: 'var(--text-on-primary)',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
  },
};
