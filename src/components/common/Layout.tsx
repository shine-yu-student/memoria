import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar, SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED, TabType } from './Sidebar';
import { useLayoutSettings } from './LayoutContext';

interface LayoutProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  settingsModalOpen: boolean;
  onOpenSettings: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  children,
}) => {
  const { sidebarPosition } = useLayoutSettings();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const isLeft = sidebarPosition === 'left';
  const sidebarWidth = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  return (
    <div style={styles.layout}>
      <TopBar />
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenSettings={onOpenSettings}
        onExpandChange={setSidebarExpanded}
      />
      <main
        style={{
          ...styles.main,
          marginLeft: isLeft ? sidebarWidth : 0,
          marginRight: isLeft ? 0 : sidebarWidth,
          transition: 'margin 0.2s ease',
        }}
      >
        <div style={styles.contentCard}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layout: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-page)',
  },
  main: {
    paddingTop: 56 + 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24,
    minHeight: '100vh',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  contentCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 16,
    border: '1px solid var(--border-default)',
    boxShadow: 'var(--shadow-card)',
    height: 'calc(100vh - 56px - 48px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};
