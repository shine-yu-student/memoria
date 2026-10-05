import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * 应用级错误边界。
 *
 * 渲染崩溃时给出不依赖崩溃组件树的兜底页：展示错误信息，并允许重试或刷新。
 */
export class ModernaErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[Memoria] 捕获到未处理异常:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.page}>
          <div style={{ fontSize: 48 }}>😵</div>
          <h2 style={styles.title}>界面出错了</h2>
          <p style={styles.message}>{this.state.message}</p>
          <p style={styles.hint}>
            数据保存在本地，不会丢失。可以先点「重试」；若持续出错，请刷新页面。
          </p>
          <div style={styles.actions}>
            <button
              style={styles.primaryBtn}
              onClick={() => this.setState({ hasError: false, message: '' })}
            >
              重试
            </button>
            <button style={styles.secondaryBtn} onClick={() => window.location.reload()}>
              刷新页面
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
