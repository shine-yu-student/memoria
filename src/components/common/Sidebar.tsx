import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLayoutSettings } from './LayoutContext';

export type TabType = 'chinese' | 'english';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSettings: () => void;
  onExpandChange?: (expanded: boolean) => void;
}

const sidebarItems: { key: TabType; icon: string; label: string }[] = [
  { key: 'chinese', icon: '📖', label: '文章记忆' },
  { key: 'english', icon: '📝', label: '英语记忆' },
];

const SIDEBAR_COLLAPSED = 56;
const SIDEBAR_EXPANDED = 180;

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onOpenSettings, onExpandChange }) => {
  const { sidebarPosition, expandOnHoverExit } = useLayoutSettings();
  const [expanded, setExpanded] = useState(false);
  const expandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const collapse = useCallback(() => {
    setExpanded(false);
    onExpandChange?.(false);
  }, [onExpandChange]);

  const handleMouseEnter = useCallback(() => {
    if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
    setExpanded(true);
    onExpandChange?.(true);
  }, [onExpandChange]);

  const handleMouseLeave = useCallback(() => {
    if (expandOnHoverExit === 'mouseleave') {
      expandTimeoutRef.current = setTimeout(collapse, 100);
    }
  }, [expandOnHoverExit, collapse]);

  // Click-outside listener
  useEffect(() => {
    if (!expanded || expandOnHoverExit !== 'click-outside') return;
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        collapse();
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [expanded, expandOnHoverExit, collapse]);

  const isLeft = sidebarPosition === 'left';

  return (
    <div
      ref={sidebarRef}
      style={{
        ...styles.sidebar,
        [isLeft ? 'left' : 'right']: 0,
        width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation icons */}
      <div style={styles.navItems}>
        {sidebarItems.map(item => (
          <button
            key={item.key}
            style={{
              ...styles.navItem,
              ...(activeTab === item.key ? styles.navItemActive : {}),
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
            onClick={() => onTabChange(item.key)}
            title={!expanded ? item.label : undefined}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {expanded && <span style={styles.navLabel}>{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Settings button at bottom */}
      <div style={styles.settingsArea}>
        <button
          style={{
            ...styles.navItem,
            justifyContent: expanded ? 'flex-start' : 'center',
          }}
          onClick={onOpenSettings}
          title={!expanded ? '设置' : undefined}
        >
          <span style={styles.navIcon}>⚙️</span>
          {expanded && <span style={styles.navLabel}>设置</span>}
        </button>
      </div>
    </div>
  );
};

export { SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED };

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    top: 56,
    bottom: 0,
    zIndex: 150,
    backgroundColor: 'var(--bg-nav)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '8px 0',
    transition: 'width 0.2s ease',
    overflow: 'hidden',
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '0 6px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 8px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 15,
    transition: 'background-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  navIcon: {
    fontSize: 20,
    flexShrink: 0,
    width: 28,
    textAlign: 'center' as const,
  },
  navLabel: {
    fontSize: 15,
  },
  settingsArea: {
    padding: '0 6px',
    paddingTop: 8,
    marginTop: 8,
  },
};
