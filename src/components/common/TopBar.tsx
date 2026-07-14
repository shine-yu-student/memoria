import React from 'react';
import { useTheme } from './ThemeProvider';

export const TopBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={styles.topBar}>
      <div style={styles.brand}>Memoria</div>
      <div style={styles.spacer} />
      <button
        style={styles.themeToggle}
        onClick={toggleTheme}
        title={theme === 'light' ? '切换深色模式' : '切换浅色模式'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    height: 56,
    backgroundColor: 'var(--bg-nav)',
    color: 'var(--text-on-nav)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 2,
  },
  spacer: {
    flex: 1,
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
