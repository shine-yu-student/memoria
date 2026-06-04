import React from 'react';

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
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    height: 56,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
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
  },
  tab: {
    padding: '8px 18px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 15,
    transition: 'all 0.15s',
  },
  activeTab: {
    backgroundColor: '#334155',
    color: '#ffffff',
    fontWeight: 600,
  },
};
