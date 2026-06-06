import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg text-fg py-12 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-fg-muted mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="space-y-6 text-sm leading-relaxed text-fg-subtle">
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">1. Acceptance of Terms</h2>
            <p>By accessing or using QueueKut, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you may not access the service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">2. Acceptable Use</h2>
            <p>As a user of QueueKut, you agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the service <strong>lawfully</strong> and in compliance with all applicable local and international regulations.</li>
              <li><strong>Not attempt unauthorized access</strong> to our systems, networks, or other users' accounts.</li>
              <li><strong>Not disrupt or interfere</strong> with the security, integrity, or performance of the service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">3. Account Suspension</h2>
            <p>QueueKut reserves the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or disrupt the service for other users. We may do so without prior notice or liability.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">4. Disclaimers</h2>
            <p>The service is provided on an <strong>"as-is" and "as available"</strong> basis. QueueKut makes no representations or warranties of any kind, express or implied, regarding the operation of the service, its continuous availability, or the accuracy of the information provided. We disclaim all warranties to the fullest extent permitted by law.</p>
          </section>
        </div>
        
        <div className="pt-8 border-t border-border">
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            &larr; Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
