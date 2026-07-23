import { Suspense } from 'react';
import RegisterPageContent from './RegisterPageContent';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function RegisterFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg text-fg">
      <div className="flex flex-col items-center gap-2.5">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-fg-subtle border-t-fg" />
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
