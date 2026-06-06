import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg text-fg py-12 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-fg-muted mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="space-y-6 text-sm leading-relaxed text-fg-subtle">
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">1. Information We Collect</h2>
            <p>QueueKut ("we", "our", or "us") collects the following personal information when you use our services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Name:</strong> To personalize your experience.</li>
              <li><strong>Email address:</strong> For communication, account recovery, and updates.</li>
              <li><strong>Profile picture:</strong> Retrieved if you choose to authenticate using Google Sign-In.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">2. How We Use Your Information</h2>
            <p>We use the collected information exclusively for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To <strong>authenticate</strong> users securely and prevent unauthorized access.</li>
              <li>To <strong>manage</strong> your account and preferences.</li>
              <li>To <strong>provide</strong> and improve our queue management services and related features.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">3. Data Sharing and Protection</h2>
            <p>Your privacy is important to us. <strong>We do not sell, rent, or trade your personal information</strong> to third parties under any circumstances. We implement standard security measures to protect your data from unauthorized access.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-fg">4. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:</p>
            <p className="font-medium text-fg">support@yourdomain.com</p>
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
