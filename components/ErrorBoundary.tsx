'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center">
          <div className="space-y-3 max-w-sm">
            <p className="text-[15px] font-semibold text-fg">Something went wrong</p>
            <p className="text-[13px] text-fg-muted">
              An unexpected error occurred. Reload to continue.
            </p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
