import React from 'react';
import { setUiMode } from '../uiMode';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 新界面（Moderna）的错误边界。
 *
 * 与全局 ErrorBoundary 的区别：除「重试」外额外提供「切换到经典界面」按钮 ——
 * 新界面是实验性的，一旦渲染崩溃，用户必须有不依赖新界面任何 UI 的逃生通道。
 * 另外两个通道是 ?ui=classic 查询参数与手动改 localStorage。
 */
export class ModernaErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[Moderna] 捕获到未处理异常:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={{ fontSize: 48 }}>😵</div>
          <h2 style={styles.title}>新界面出错了</h2>
          <p style={styles.message}>{this.state.message}</p>
          <p style={styles.hint}>
            你可以切回经典界面继续使用；数据不会丢失。
          </p>
          <div style={styles.actions}>
            <button style={styles.primaryBtn} onClick={() => setUiMode('classic')}>
              切换到经典界面
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 48,
    textAlign: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: 'var(--m-text, #1e293b)',
  },
  title: { margin: '16px 0 8px' },
  message: { color: 'var(--m-danger, #dc2626)', fontSize: 14, wordBreak: 'break-all' },
  hint: { color: 'var(--m-text-secondary, #64748b)', fontSize: 13, marginTop: 8 },
  actions: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 },
  primaryBtn: {
    padding: '10px 28px',
    fontSize: 15,
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'var(--m-accent, #4f6bed)',
    color: '#fff',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 28px',
    fontSize: 15,
    border: '1px solid var(--m-border, #e2e8f0)',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
  },
};
