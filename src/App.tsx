import React, { useState } from 'react';
import { Layout } from './components/common/Layout';
import { TabType } from './components/common/Sidebar';
import { LayoutSettingsProvider } from './components/common/LayoutContext';
import { ThemeProvider } from './components/common/ThemeProvider';
import { ArticleManager } from './components/chinese/ArticleManager';
import { BookManager } from './components/english/BookManager';
import { SettingsModal } from './components/common/SettingsModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chinese');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <ThemeProvider>
      <LayoutSettingsProvider>
        <Layout
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setSettingsOpen(true)}
          settingsModalOpen={settingsOpen}
        >
          {activeTab === 'chinese' && <ArticleManager key={`chinese-${refreshKey}`} />}
          {activeTab === 'english' && <BookManager key={`english-${refreshKey}`} />}
        </Layout>
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onDataChanged={handleDataChanged}
        />
      </LayoutSettingsProvider>
    </ThemeProvider>
  );
};

export default App;
