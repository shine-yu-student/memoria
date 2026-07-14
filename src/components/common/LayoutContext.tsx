import React, { createContext, useContext, useState, useCallback } from 'react';

type SidebarPosition = 'left' | 'right';

interface LayoutSettings {
  sidebarPosition: SidebarPosition;
  setSidebarPosition: (pos: SidebarPosition) => void;
  expandOnHoverExit: 'mouseleave' | 'click-outside';
  setExpandOnHoverExit: (mode: 'mouseleave' | 'click-outside') => void;
  hidePreviousSentences: boolean;
  setHidePreviousSentences: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutSettings>({
  sidebarPosition: 'left',
  setSidebarPosition: () => {},
  expandOnHoverExit: 'mouseleave',
  setExpandOnHoverExit: () => {},
  hidePreviousSentences: false,
  setHidePreviousSentences: () => {},
});

export const useLayoutSettings = () => useContext(LayoutContext);

const STORAGE_SIDEBAR_POS = 'memoria:sidebarPosition';
const STORAGE_EXPAND_MODE = 'memoria:expandOnHoverExit';

export const LayoutSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarPosition, setSidebarPositionState] = useState<SidebarPosition>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SIDEBAR_POS);
      if (saved === 'left' || saved === 'right') return saved;
    } catch {}
    return 'left';
  });

  const [expandOnHoverExit, setExpandOnHoverExitState] = useState<'mouseleave' | 'click-outside'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EXPAND_MODE);
      if (saved === 'mouseleave' || saved === 'click-outside') return saved;
    } catch {}
    return 'mouseleave';
  });

  const [hidePreviousSentences, setHidePreviousSentencesState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('memoria:hidePrevious');
      return saved === 'true';
    } catch {}
    return false;
  });

  const setSidebarPosition = useCallback((pos: SidebarPosition) => {
    setSidebarPositionState(pos);
    try { localStorage.setItem(STORAGE_SIDEBAR_POS, pos); } catch {}
  }, []);

  const setExpandOnHoverExit = useCallback((mode: 'mouseleave' | 'click-outside') => {
    setExpandOnHoverExitState(mode);
    try { localStorage.setItem(STORAGE_EXPAND_MODE, mode); } catch {}
  }, []);

  const setHidePreviousSentences = useCallback((v: boolean) => {
    setHidePreviousSentencesState(v);
    try { localStorage.setItem('memoria:hidePrevious', v.toString()); } catch {}
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        sidebarPosition,
        setSidebarPosition,
        expandOnHoverExit,
        setExpandOnHoverExit,
        hidePreviousSentences,
        setHidePreviousSentences,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
