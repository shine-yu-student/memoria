import React, { useState } from 'react';
import { Layout } from './components/common/Layout';
import { TabType } from './components/common/Sidebar';
import { LayoutSettingsProvider } from './components/common/LayoutContext';
import { ThemeProvider } from './components/common/ThemeProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ArticleManager } from './components/chinese/ArticleManager';
import { BookManager } from './components/english/BookManager';
import { SettingsModal } from './components/common/SettingsModal';
import { useUiMode } from './uiMode';
import { ModernaApp } from './moderna/ModernaApp';
import { ModernaErrorBoundary } from './moderna/ModernaErrorBoundary';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chinese');
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 数据版本号：数据变更时递增，通知各管理器重新加载数据；不重挂载组件，
  // 避免全量导入等操作打断进行中的记忆会话或未保存的编辑
  const [dataVersion, setDataVersion] = useState(0);
  const [uiMode] = useUiMode();

  const handleDataChanged = () => {
    setDataVersion(v => v + 1);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LayoutSettingsProvider>
          {uiMode === 'classic' ? (
            <>
              <Layout
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onOpenSettings={() => setSettingsOpen(true)}
              >
                {activeTab === 'chinese' && <ArticleManager dataVersion={dataVersion} />}
                {activeTab === 'english' && <BookManager dataVersion={dataVersion} />}
              </Layout>
              <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onDataChanged={handleDataChanged}
              />
            </>
          ) : (
            <ModernaErrorBoundary>
              <ModernaApp dataVersion={dataVersion} onDataChanged={handleDataChanged} />
            </ModernaErrorBoundary>
          )}
        </LayoutSettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
