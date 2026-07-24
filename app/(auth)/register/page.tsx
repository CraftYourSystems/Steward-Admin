import { Suspense } from 'react';
import RegisterPageContent from './RegisterPageContent';
import { Logo } from '@/components/ui/Logo';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function RegisterFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg text-fg">
      <div className="flex flex-col items-center gap-3">
        <Logo imgClassName="h-8" />
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-fg-subtle border-t-fg mt-1" />
        <p className="text-[11px] font-medium text-fg-subtle tracking-wide uppercase">Loading</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
