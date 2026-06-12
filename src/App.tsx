import React, { useState } from 'react';
import { Navbar, TabType } from './components/common/Navbar';
import { ArticleManager } from './components/chinese/ArticleManager';
import { BookManager } from './components/english/BookManager';
import { ImportExportPage } from './components/common/ImportExportPage';
import { ThemeProvider } from './components/common/ThemeProvider';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chinese');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <ThemeProvider>
      <div style={styles.app}>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
        <main style={styles.main}>
          {activeTab === 'chinese' && <ArticleManager key={`chinese-${refreshKey}`} />}
          {activeTab === 'english' && <BookManager key={`english-${refreshKey}`} />}
          {activeTab === 'import-export' && (
            <ImportExportPage key={`ie-${refreshKey}`} onDataChanged={handleDataChanged} />
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-page)',
    paddingTop: 56,
  },
  main: {
    paddingTop: 8,
  },
};

export default App;
