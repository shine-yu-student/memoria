import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * 全局错误边界：捕获渲染期间未处理的异常，避免整页白屏。
 * 显示错误信息并允许重试（重试后若仍崩溃，可引导用户清理数据）。
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] 捕获到未处理异常:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48, textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ fontSize: 48 }}>😵</div>
          <h2 style={{ margin: '16px 0 8px' }}>页面出错了</h2>
          <p style={{ color: '#c0392b', fontSize: 14, wordBreak: 'break-all' }}>{this.state.message}</p>
          <p style={{ color: '#888', fontSize: 13 }}>
            如果刷新后仍然报错，可能是本地数据损坏，请到设置中检查或清理数据。
          </p>
          <button
            style={{
              padding: '10px 28px',
              fontSize: 15,
              border: 'none',
              borderRadius: 8,
              backgroundColor: '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
              marginTop: 12,
            }}
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
