import React, { useState } from 'react';
import { ThemeProvider } from './moderna/lib/ThemeProvider';
import { ModernaErrorBoundary } from './moderna/ModernaErrorBoundary';
import { ModernaApp } from './moderna/ModernaApp';

/**
 * 应用根组件。
 *
 * 界面只有一套（src/moderna），主题由 ThemeProvider 统一提供。
 */
const App: React.FC = () => {
  // 数据版本号：数据变更时递增，通知各模块重新加载数据；不重挂载组件，
  // 避免全量导入等操作打断进行中的记忆会话或未保存的编辑
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataChanged = () => {
    setDataVersion(v => v + 1);
  };

  return (
    <ThemeProvider>
      <ModernaErrorBoundary>
        <ModernaApp dataVersion={dataVersion} onDataChanged={handleDataChanged} />
      </ModernaErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
